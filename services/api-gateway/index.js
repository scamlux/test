const express = require("express");
const gatewayController = require("./presentation/gatewayController");

const app = express();
app.use(express.json());

app.use("/api", gatewayController);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.listen(8000, () => {
  console.log("API Gateway running on port 8000");
  console.log("Available endpoints:");
  console.log("  POST   /api/products          - Create product");
  console.log("  GET    /api/products          - List products");
  console.log("  POST   /api/orders            - Create order");
  console.log("  GET    /api/orders            - List orders");
  console.log("  POST   /api/deliveries        - Create delivery");
  console.log("  GET    /api/logs              - View all request logs");
  console.log("  GET    /api/logs/:service     - View service logs");
});
