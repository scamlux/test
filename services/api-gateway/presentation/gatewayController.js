const express = require("express");
const { proxyRequest } = require("../application/proxyService");
const requestLogRepository = require("../domain/RequestLogRepository");

const router = express.Router();

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

module.exports = router;
