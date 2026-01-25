const express = require("express");
const { proxyRequest } = require("../application/proxyService");
const requestLogRepository = require("../domain/RequestLogRepository");

const router = express.Router();

// ===================================
// AUTH ENDPOINTS (Proxy to auth-service)
// ===================================
router.post("/auth/register", async (req, res) => {
  try {
    const data = await proxyRequest(
      "auth-service",
      "POST",
      "/api/auth/register",
      req.body,
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const data = await proxyRequest(
      "auth-service",
      "POST",
      "/api/auth/login",
      req.body,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.post("/auth/refresh", async (req, res) => {
  try {
    const data = await proxyRequest(
      "auth-service",
      "POST",
      "/api/auth/refresh",
      req.body,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    const data = await proxyRequest(
      "auth-service",
      "GET",
      "/api/auth/me",
      null,
      req.headers.authorization,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.post("/auth/verify", async (req, res) => {
  try {
    const data = await proxyRequest(
      "auth-service",
      "POST",
      "/api/auth/verify",
      null,
      req.headers.authorization,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.post("/auth/logout", async (req, res) => {
  try {
    const data = await proxyRequest(
      "auth-service",
      "POST",
      "/api/auth/logout",
      null,
      req.headers.authorization,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// ===================================
// PRODUCT ENDPOINTS
// ===================================
router.get("/products", async (req, res) => {
  try {
    const data = await proxyRequest("product-service", "GET", "/api/products");
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.post("/products", async (req, res) => {
  try {
    const data = await proxyRequest(
      "product-service",
      "POST",
      "/api/products",
      req.body,
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const data = await proxyRequest(
      "product-service",
      "GET",
      `/api/products/${req.params.id}`,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const data = await proxyRequest(
      "product-service",
      "PUT",
      `/api/products/${req.params.id}`,
      req.body,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const data = await proxyRequest(
      "product-service",
      "DELETE",
      `/api/products/${req.params.id}`,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// ===================================
// ORDER ENDPOINTS
// ===================================
router.post("/orders", async (req, res) => {
  try {
    const data = await proxyRequest(
      "order-service",
      "POST",
      "/orders",
      req.body,
    );
    res.status(202).json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.get("/orders", async (req, res) => {
  try {
    const data = await proxyRequest("query-service", "GET", "/orders");
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const data = await proxyRequest(
      "query-service",
      "GET",
      `/orders/${req.params.id}`,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// ===================================
// DELIVERY ENDPOINTS
// ===================================
router.get("/deliveries", async (req, res) => {
  try {
    const data = await proxyRequest(
      "delivery-service",
      "GET",
      "/api/deliveries",
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.post("/deliveries", async (req, res) => {
  try {
    const data = await proxyRequest(
      "delivery-service",
      "POST",
      "/api/deliveries",
      req.body,
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.post("/deliveries/:id/start", async (req, res) => {
  try {
    const data = await proxyRequest(
      "delivery-service",
      "POST",
      `/api/deliveries/${req.params.id}/start`,
      req.body,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.post("/deliveries/:id/confirm", async (req, res) => {
  try {
    const data = await proxyRequest(
      "delivery-service",
      "POST",
      `/api/deliveries/${req.params.id}/confirm`,
      req.body,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.get("/deliveries/:id", async (req, res) => {
  try {
    const data = await proxyRequest(
      "delivery-service",
      "GET",
      `/api/deliveries/${req.params.id}`,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// ===================================
// REQUEST LOGS ENDPOINTS
// ===================================
router.get("/logs", async (req, res) => {
  try {
    const logs = await requestLogRepository.getAllLogs(
      parseInt(req.query.limit) || 100,
    );
    res.json({
      status: "success",
      data: logs,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

router.get("/logs/:service", async (req, res) => {
  try {
    const logs = await requestLogRepository.getLogs(
      req.params.service,
      parseInt(req.query.limit) || 50,
    );
    res.json({
      status: "success",
      data: logs,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// ===================================
// REAL DATA ENDPOINTS (v2 with DB)
// ===================================

// Get all orders with role-based filtering
router.get("/v2/orders", async (req, res) => {
  try {
    const data = await proxyRequest(
      "query-service",
      "GET",
      "/api/v2/orders",
      null,
      req.headers.authorization,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// Get specific order by ID
router.get("/v2/orders/:id", async (req, res) => {
  try {
    const data = await proxyRequest(
      "query-service",
      "GET",
      `/api/v2/orders/${req.params.id}`,
      null,
      req.headers.authorization,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// Create new order
router.post("/v2/orders", async (req, res) => {
  try {
    const data = await proxyRequest(
      "query-service",
      "POST",
      "/api/v2/orders",
      req.body,
      req.headers.authorization,
    );
    res.status(201).json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// Update order status
router.put("/v2/orders/:id", async (req, res) => {
  try {
    const data = await proxyRequest(
      "query-service",
      "PUT",
      `/api/v2/orders/${req.params.id}`,
      req.body,
      req.headers.authorization,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// Get dashboard statistics
router.get("/v2/dashboard", async (req, res) => {
  try {
    const data = await proxyRequest(
      "query-service",
      "GET",
      "/api/v2/dashboard",
      null,
      req.headers.authorization,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// Get all products
router.get("/v2/products", async (req, res) => {
  try {
    const data = await proxyRequest(
      "query-service",
      "GET",
      "/api/v2/products",
      null,
      req.headers.authorization,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

// Get specific product
router.get("/v2/products/:id", async (req, res) => {
  try {
    const data = await proxyRequest(
      "query-service",
      "GET",
      `/api/v2/products/${req.params.id}`,
      null,
      req.headers.authorization,
    );
    res.json(data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      status: "error",
      message: err.message,
    });
  }
});

module.exports = router;
