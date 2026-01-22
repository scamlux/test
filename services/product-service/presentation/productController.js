require("../../shared/otel");

const express = require("express");
const {
  CreateProductUseCase,
  UpdateProductUseCase,
  GetProductUseCase,
  ListProductsUseCase,
  DeleteProductUseCase,
  ReserveProductStockUseCase,
  ReleaseProductStockUseCase,
} = require("../application/usecases");
const log = require("../../shared/logger");

const router = express.Router();

// ===================================
// PRESENTATION LAYER - REST API
// ===================================

// CREATE PRODUCT
router.post("/products", async (req, res) => {
  try {
    const product = await CreateProductUseCase.execute(req.body);
    res.status(201).json({
      status: "success",
      data: product,
    });
  } catch (err) {
    log("ProductService", "-", `Error creating product: ${err.message}`);
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
});

// LIST PRODUCTS
router.get("/products", async (req, res) => {
  try {
    const products = await ListProductsUseCase.execute();
    res.json({
      status: "success",
      data: products,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
});

// GET PRODUCT
router.get("/products/:id", async (req, res) => {
  try {
    const product = await GetProductUseCase.execute(req.params.id);
    res.json({
      status: "success",
      data: product,
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
});

// UPDATE PRODUCT
router.put("/products/:id", async (req, res) => {
  try {
    const product = await UpdateProductUseCase.execute({
      id: req.params.id,
      ...req.body,
    });
    res.json({
      status: "success",
      data: product,
    });
  } catch (err) {
    res.status(400).json({
      status: "error",
      message: err.message,
    });
  }
});

// DELETE PRODUCT
router.delete("/products/:id", async (req, res) => {
  try {
    await DeleteProductUseCase.execute(req.params.id);
    res.json({
      status: "success",
      message: "Product deleted",
    });
  } catch (err) {
    res.status(404).json({
      status: "error",
      message: err.message,
    });
  }
});

module.exports = router;
