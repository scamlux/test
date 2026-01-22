require("../shared/otel");

const express = require("express");
const productController = require("./presentation/productController");
const log = require("../shared/logger");

const app = express();
app.use(express.json());

app.use("/api", productController);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "product-service" });
});

app.listen(8003, () => {
  log("ProductService", "-", "Product Service running on port 8003");
});
