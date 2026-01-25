/**
 * Real Data Handler for Query Service
 * Fetches actual data from PostgreSQL instead of in-memory store
 */

const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "orders_user",
  password: process.env.DB_PASSWORD || "orders_pass",
  database: process.env.DB_NAME || "orders_db",
});

/**
 * Get all orders for authenticated user
 * ADMIN: sees all orders
 * SELLER: sees orders containing their products
 * BUYER: sees only their own orders
 * DELIVERY_AGENT: sees orders assigned to them for delivery
 */
async function getOrdersByRole(userId, roles) {
  try {
    if (roles.includes("ADMIN")) {
      // Admin sees all orders with detailed info
      const result = await pool.query(`
        SELECT 
          o.id,
          o.buyer_id,
          u.first_name as buyer_name,
          u.email as buyer_email,
          o.status,
          o.payment_status,
          o.total_amount,
          o.created_at,
          o.updated_at,
          json_agg(json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', p.name,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price
          )) as items
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY o.id, u.first_name, u.email
        ORDER BY o.created_at DESC
        LIMIT 100
      `);
      return result.rows;
    } else if (roles.includes("SELLER")) {
      // Seller sees orders containing their products + new orders
      const result = await pool.query(
        `
        SELECT DISTINCT
          o.id,
          o.buyer_id,
          u.first_name as buyer_name,
          u.email as buyer_email,
          o.status,
          o.payment_status,
          o.total_amount,
          o.created_at,
          o.updated_at,
          json_agg(json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', p.name,
            'sellerId', p.seller_id,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price
          )) as items
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE p.seller_id = $1 OR o.id IN (
          SELECT DISTINCT order_id FROM order_items oi2
          JOIN products p2 ON oi2.product_id = p2.id
          WHERE p2.seller_id = $1
        )
        GROUP BY o.id, u.first_name, u.email
        ORDER BY o.created_at DESC
        LIMIT 100
      `,
        [userId],
      );
      return result.rows;
    } else if (roles.includes("DELIVERY_AGENT")) {
      // Delivery agent sees orders assigned to them for delivery
      const result = await pool.query(
        `
        SELECT 
          o.id,
          o.buyer_id,
          u.first_name as buyer_name,
          u.email as buyer_email,
          o.status,
          o.payment_status,
          o.shipping_address,
          d.status as delivery_status,
          d.created_at as delivery_start,
          o.created_at,
          o.updated_at,
          json_agg(json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', p.name,
            'quantity', oi.quantity
          )) as items
        FROM orders o
        LEFT JOIN users u ON o.buyer_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN deliveries d ON o.id = d.order_id
        WHERE d.delivery_agent_id = $1
        GROUP BY o.id, u.first_name, u.email, d.status, d.created_at
        ORDER BY o.created_at DESC
        LIMIT 100
      `,
        [userId],
      );
      return result.rows;
    } else {
      // Buyer sees only their own orders
      const result = await pool.query(
        `
        SELECT 
          o.id,
          o.buyer_id,
          o.status,
          o.payment_status,
          o.payment_method,
          o.total_amount,
          o.shipping_address,
          o.created_at,
          o.updated_at,
          d.status as delivery_status,
          json_agg(json_build_object(
            'id', oi.id,
            'productId', oi.product_id,
            'productName', p.name,
            'sellerName', u.first_name,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price
          )) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN users u ON p.seller_id = u.id
        LEFT JOIN deliveries d ON o.id = d.order_id
        WHERE o.buyer_id = $1
        GROUP BY o.id, d.status
        ORDER BY o.created_at DESC
      `,
        [userId],
      );
      return result.rows;
    }
  } catch (error) {
    console.error("Error fetching orders by role:", error);
    throw error;
  }
}

/**
 * Get dashboard statistics by role
 */
async function getDashboardStats(userId, roles) {
  try {
    if (roles.includes("ADMIN")) {
      const result = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'CONFIRMED') as completed_orders,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_orders,
          COUNT(*) FILTER (WHERE status = 'SHIPPED') as shipped_orders,
          COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_orders,
          COUNT(*) as total_orders,
          COUNT(DISTINCT buyer_id) as unique_buyers,
          SUM(CASE WHEN status = 'CONFIRMED' THEN total_amount ELSE 0 END) as revenue
        FROM orders
      `);
      const row = result.rows[0];
      return {
        totalOrders: parseInt(row.total_orders) || 0,
        completedOrders: parseInt(row.completed_orders) || 0,
        pendingOrders: parseInt(row.pending_orders) || 0,
        shippedOrders: parseInt(row.shipped_orders) || 0,
        cancelledOrders: parseInt(row.cancelled_orders) || 0,
        uniqueBuyers: parseInt(row.unique_buyers) || 0,
        totalRevenue: parseFloat(row.revenue) || 0,
        totalProducts: (
          await pool.query("SELECT COUNT(*) as count FROM products")
        ).rows[0].count,
        totalDeliveries: (
          await pool.query("SELECT COUNT(*) as count FROM deliveries")
        ).rows[0].count,
      };
    } else if (roles.includes("SELLER")) {
      const result = await pool.query(
        `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE o.status = 'CONFIRMED') as completed_orders,
          COUNT(*) FILTER (WHERE o.status = 'PENDING') as pending_orders,
          SUM(CASE WHEN o.status = 'CONFIRMED' THEN o.total_amount ELSE 0 END) as revenue,
          COUNT(DISTINCT oi.product_id) as product_count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN products p ON oi.product_id = p.id
        WHERE p.seller_id = $1
      `,
        [userId],
      );
      const row = result.rows[0];
      return {
        totalOrders: parseInt(row.total_orders) || 0,
        completedOrders: parseInt(row.completed_orders) || 0,
        pendingOrders: parseInt(row.pending_orders) || 0,
        totalRevenue: parseFloat(row.revenue) || 0,
        productCount: parseInt(row.product_count) || 0,
        totalProducts: (
          await pool.query(
            "SELECT COUNT(*) as count FROM products WHERE seller_id = $1",
            [userId],
          )
        ).rows[0].count,
      };
    } else {
      // Buyer stats
      const result = await pool.query(
        `
        SELECT 
          COUNT(*) as total_orders,
          COUNT(*) FILTER (WHERE status = 'CONFIRMED') as completed_orders,
          COUNT(*) FILTER (WHERE status = 'PENDING') as pending_orders,
          SUM(total_amount) as total_spent
        FROM orders
        WHERE buyer_id = $1
      `,
        [userId],
      );
      const row = result.rows[0];
      return {
        totalOrders: parseInt(row.total_orders) || 0,
        completedOrders: parseInt(row.completed_orders) || 0,
        pendingOrders: parseInt(row.pending_orders) || 0,
        totalSpent: parseFloat(row.total_spent) || 0,
      };
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

/**
 * Get all products with filtering
 */
async function getProducts(sellerId = null, limit = 100) {
  try {
    let query = `
      SELECT 
        p.id,
        p.seller_id,
        u.first_name as seller_name,
        p.sku,
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.status,
        p.visibility,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.visibility = 'PUBLIC'
    `;
    const params = [];

    if (sellerId) {
      query += ` OR p.seller_id = $1`;
      params.push(sellerId);
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

/**
 * Get single product by ID
 */
async function getProductById(productId) {
  try {
    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.seller_id,
        u.first_name as seller_name,
        u.email as seller_email,
        p.sku,
        p.name,
        p.description,
        p.price,
        p.stock_quantity,
        p.status,
        p.visibility,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1
    `,
      [productId],
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}

/**
 * Get order by ID with full details
 */
async function getOrderById(orderId) {
  try {
    const result = await pool.query(
      `
      SELECT 
        o.id,
        o.buyer_id,
        u.first_name as buyer_name,
        u.email as buyer_email,
        o.status,
        o.payment_status,
        o.payment_method,
        o.total_amount,
        o.shipping_address,
        o.notes,
        o.created_at,
        o.updated_at,
        json_agg(json_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'productName', p.name,
          'quantity', oi.quantity,
          'unitPrice', oi.unit_price,
          'sellerId', p.seller_id
        )) as items
      FROM orders o
      LEFT JOIN users u ON o.buyer_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, u.first_name, u.email
    `,
      [orderId],
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    throw error;
  }
}

module.exports = {
  getOrdersByRole,
  getDashboardStats,
  getProducts,
  getProductById,
  getOrderById,
  pool,
};
