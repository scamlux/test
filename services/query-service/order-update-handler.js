/**
 * Order Status Update Handler
 * Handles order status changes with role-based authorization
 */

const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "orders_user",
  password: process.env.DB_PASSWORD || "orders_pass",
  database: process.env.DB_NAME || "orders_db",
});

/**
 * Check if user has permission to update order status
 * ADMIN: can change any order to any status
 * SELLER: can change status of orders containing their products (PENDING->CONFIRMED, etc)
 * BUYER: can change only own orders (to CANCELLED)
 * DELIVERY_AGENT: can change delivery status (SHIPPED->DELIVERED)
 */
async function canUpdateOrderStatus(userId, roles, orderId, newStatus) {
  try {
    const order = await pool.query("SELECT * FROM orders WHERE id = $1", [
      orderId,
    ]);
    if (order.rows.length === 0) {
      return { allowed: false, reason: "Order not found" };
    }

    const orderData = order.rows[0];

    // ADMIN can do anything
    if (roles.includes("ADMIN")) {
      return { allowed: true };
    }

    // BUYER can cancel their own orders
    if (roles.includes("BUYER")) {
      if (orderData.buyer_id !== userId) {
        return { allowed: false, reason: "Can only modify your own orders" };
      }
      if (newStatus === "CANCELLED") {
        return { allowed: true };
      }
      return { allowed: false, reason: "Buyers can only cancel orders" };
    }

    // SELLER can confirm/ship orders containing their products
    if (roles.includes("SELLER")) {
      const sellerCheck = await pool.query(
        `
        SELECT COUNT(*) FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1 AND p.seller_id = $2
      `,
        [orderId, userId],
      );

      if (parseInt(sellerCheck.rows[0].count) === 0) {
        return {
          allowed: false,
          reason: "You don't have products in this order",
        };
      }

      // Sellers can transition: PENDING->CONFIRMED, CONFIRMED->SHIPPED
      const allowedTransitions = {
        PENDING: ["CONFIRMED", "CANCELLED"],
        CONFIRMED: ["SHIPPED"],
      };

      if (allowedTransitions[orderData.status]?.includes(newStatus)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Cannot change ${orderData.status} to ${newStatus}`,
      };
    }

    // DELIVERY_AGENT can update delivery status
    if (roles.includes("DELIVERY_AGENT")) {
      const deliveryCheck = await pool.query(
        `
        SELECT * FROM deliveries WHERE order_id = $1 AND delivery_agent_id = $2
      `,
        [orderId, userId],
      );

      if (deliveryCheck.rows.length === 0) {
        return { allowed: false, reason: "Delivery not assigned to you" };
      }

      // Can transition from SHIPPED to DELIVERED
      if (orderData.status === "SHIPPED" && newStatus === "DELIVERED") {
        return { allowed: true };
      }
      return { allowed: false, reason: "Cannot update delivery status" };
    }

    return { allowed: false, reason: "Insufficient permissions" };
  } catch (error) {
    console.error("Error checking update permission:", error);
    return { allowed: false, reason: "Permission check failed" };
  }
}

/**
 * Update order status with audit logging
 */
async function updateOrderStatus(userId, orderId, newStatus) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get old status
    const oldResult = await client.query(
      "SELECT status, buyer_id FROM orders WHERE id = $1",
      [orderId],
    );
    if (oldResult.rows.length === 0) {
      throw new Error("Order not found");
    }

    const oldStatus = oldResult.rows[0].status;
    const buyerId = oldResult.rows[0].buyer_id;

    // Update order
    const updateResult = await client.query(
      "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [newStatus, orderId],
    );

    // Log to audit_logs
    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `,
      [
        userId,
        "UPDATE_ORDER_STATUS",
        "orders",
        orderId,
        JSON.stringify({ status: oldStatus }),
        JSON.stringify({ status: newStatus }),
      ],
    );

    // Create notification for buyer if status changed
    if (oldStatus !== newStatus && buyerId) {
      const statusMessages = {
        CONFIRMED: "Your order has been confirmed",
        SHIPPED: "Your order is on the way",
        DELIVERED: "Your order has been delivered",
        CANCELLED: "Your order has been cancelled",
      };

      await client.query(
        `
        INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `,
        [
          buyerId,
          "Order Status Updated",
          statusMessages[newStatus] || `Order status changed to ${newStatus}`,
          "ORDER_UPDATE",
          "orders",
          orderId,
        ],
      );
    }

    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Create order (for buyers)
 */
async function createOrder(userId, items, shippingAddress, notes = null) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      const productResult = await client.query(
        "SELECT price FROM products WHERE id = $1",
        [item.productId],
      );
      if (productResult.rows.length === 0) {
        throw new Error(`Product ${item.productId} not found`);
      }
      totalAmount += productResult.rows[0].price * item.quantity;
    }

    // Create order
    const orderResult = await client.query(
      `
      INSERT INTO orders (buyer_id, status, total_amount, shipping_address, notes, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `,
      [userId, "PENDING", totalAmount, JSON.stringify(shippingAddress), notes],
    );

    const orderId = orderResult.rows[0].id;

    // Create order items
    for (const item of items) {
      const productResult = await client.query(
        "SELECT price FROM products WHERE id = $1",
        [item.productId],
      );

      await client.query(
        `
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `,
        [orderId, item.productId, item.quantity, productResult.rows[0].price],
      );

      // Update stock
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2",
        [item.quantity, item.productId],
      );
    }

    // Log to audit_logs
    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
      [
        userId,
        "CREATE_ORDER",
        "orders",
        orderId,
        JSON.stringify({ items, totalAmount }),
      ],
    );

    await client.query("COMMIT");
    return orderResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  canUpdateOrderStatus,
  updateOrderStatus,
  createOrder,
  pool,
};
