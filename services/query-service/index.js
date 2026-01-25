require("../shared/otel");

const express = require("express");
const { Kafka } = require("kafkajs");
const getHandler = require("./handlers/eventHandlerFactory");
const store = require("./readStore");
const realDataHandler = require("./real-data-handler");
const orderUpdateHandler = require("./order-update-handler");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const kafka = new Kafka({
  clientId: "query-service",
  brokers: (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

const consumer = kafka.consumer({ groupId: "query-group" });

async function start() {
  await consumer.connect();

  await consumer.subscribe({ topic: "order.created", fromBeginning: true });
  await consumer.subscribe({
    topic: "inventory.reserved",
    fromBeginning: true,
  });
  await consumer.subscribe({ topic: "payment.failed", fromBeginning: true });
  await consumer.subscribe({
    topic: "inventory.released",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      const handler = getHandler(event.eventType);
      if (handler) await handler(event);
    },
  });
}

start().catch(console.error);

// READ API (Mock data - deprecated)
app.get("/orders", (req, res) => {
  res.json(store.getAllOrders());
});

app.get("/orders/:id", (req, res) => {
  const order = store.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

// ===== REAL DATA API (v2) =====

// Middleware to verify JWT and extract user info
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // Allow unauthenticated requests for public endpoints
    req.user = null;
    req.roles = [];
    return next();
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET ||
      "agri-platform-super-secret-jwt-key-change-in-production",
    (err, decoded) => {
      if (err) {
        return res.status(401).json({ error: "Invalid token" });
      }
      req.user = decoded;
      req.roles = decoded.roles || [];
      next();
    },
  );
}

// Apply token verification to real data routes
app.use("/api/v2", verifyToken);

/**
 * GET /api/v2/orders - Get orders (role-based filtering)
 * Returns different data based on user role:
 * - ADMIN: all orders
 * - SELLER: orders containing their products
 * - DELIVERY_AGENT: orders assigned to them
 * - BUYER: their own orders
 */
app.get("/api/v2/orders", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const orders = await realDataHandler.getOrdersByRole(
      req.user.userId,
      req.roles,
    );
    res.json({
      status: "success",
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

/**
 * GET /api/v2/orders/:id - Get order by ID
 */
app.get("/api/v2/orders/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const order = await realDataHandler.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check access (ADMIN can see all, others only their own)
    if (!req.roles.includes("ADMIN") && order.buyer_id !== req.user.userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      status: "success",
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

/**
 * GET /api/v2/dashboard - Get dashboard statistics (role-based)
 */
app.get("/api/v2/dashboard", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const stats = await realDataHandler.getDashboardStats(
      req.user.userId,
      req.roles,
    );
    res.json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

/**
 * GET /api/v2/products - Get all products (public or user's own)
 */
app.get("/api/v2/products", async (req, res) => {
  try {
    const sellerId =
      req.user && req.roles.includes("SELLER") ? req.user.userId : null;
    const limit = parseInt(req.query.limit) || 100;

    const products = await realDataHandler.getProducts(sellerId, limit);
    res.json({
      status: "success",
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * GET /api/v2/products/:id - Get product by ID
 */
app.get("/api/v2/products/:id", async (req, res) => {
  try {
    const product = await realDataHandler.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      status: "success",
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

/**
 * PUT /api/v2/orders/:id - Update order status (role-based)
 * Only users with appropriate roles can update orders
 */
app.put("/api/v2/orders/:id", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    // Check if user has permission to update this order
    const permission = await orderUpdateHandler.canUpdateOrderStatus(
      req.user.userId,
      req.roles,
      req.params.id,
      status,
    );

    if (!permission.allowed) {
      return res.status(403).json({
        error: "Permission denied",
        reason: permission.reason,
      });
    }

    // Update order status
    const updatedOrder = await orderUpdateHandler.updateOrderStatus(
      req.user.userId,
      req.params.id,
      status,
    );

    res.json({
      status: "success",
      message: `Order status updated to ${status}`,
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

/**
 * POST /api/v2/orders - Create new order
 * Only buyers can create orders
 */
app.post("/api/v2/orders", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!req.roles.includes("BUYER") && !req.roles.includes("ADMIN")) {
      return res.status(403).json({ error: "Only buyers can create orders" });
    }

    const { items, shippingAddress, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    const newOrder = await orderUpdateHandler.createOrder(
      req.user.userId,
      items,
      shippingAddress,
      notes,
    );

    res.status(201).json({
      status: "success",
      message: "Order created successfully",
      data: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
});

app.listen(process.env.PORT || 8002, () => {
  console.log("✅ Query Service running on port", process.env.PORT || 8002);
  console.log("📊 Real Data Endpoints:");
  console.log("   GET  /api/v2/orders - Get orders (role-based)");
  console.log("   POST /api/v2/orders - Create new order");
  console.log("   GET  /api/v2/orders/:id - Get order by ID");
  console.log("   PUT  /api/v2/orders/:id - Update order status");
  console.log("   GET  /api/v2/dashboard - Get dashboard stats");
  console.log("   GET  /api/v2/products - Get products");
  console.log("   GET  /api/v2/products/:id - Get product by ID");
});
