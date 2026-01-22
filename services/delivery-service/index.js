require("../shared/otel");

const express = require("express");
const deliveryController = require("./presentation/deliveryController");
const log = require("../shared/logger");

const app = express();
app.use(express.json());

app.use("/api", deliveryController);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "delivery-service" });
});

app.listen(8004, () => {
  log("DeliveryService", "-", "Delivery Service running on port 8004");
});
