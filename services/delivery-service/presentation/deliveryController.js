require("../../shared/otel");

const express = require("express");
const {
  CreateDeliveryUseCase,
  StartDeliveryUseCase,
  ConfirmDeliveryUseCase,
  CancelDeliveryUseCase,
  GetDeliveryUseCase,
} = require("../application/usecases");
const log = require("../../shared/logger");

const router = express.Router();

// CREATE DELIVERY
router.post("/deliveries", async (req, res) => {
  try {
    const { orderId, expectedDeliveryDate } = req.body;
    const delivery = await CreateDeliveryUseCase.execute({
      orderId,
      expectedDeliveryDate,
    });
    res.status(201).json({
      status: "success",
      data: delivery,
    });
  } catch (err) {
    log("DeliveryService", "-", `Error: ${err.message}`);
    res.status(400).json({ status: "error", message: err.message });
  }
});

// START DELIVERY
router.post("/deliveries/:id/start", async (req, res) => {
  try {
    const delivery = await StartDeliveryUseCase.execute(req.params.id);
    res.json({ status: "success", data: delivery });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
});

// CONFIRM DELIVERY
router.post("/deliveries/:id/confirm", async (req, res) => {
  try {
    const { recipientName, signature, notes } = req.body;
    const delivery = await ConfirmDeliveryUseCase.execute({
      deliveryId: req.params.id,
      recipientName,
      signature,
      notes,
    });
    res.json({ status: "success", data: delivery });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
});

// CANCEL DELIVERY
router.post("/deliveries/:id/cancel", async (req, res) => {
  try {
    const { reason } = req.body;
    const delivery = await CancelDeliveryUseCase.execute({
      deliveryId: req.params.id,
      reason,
    });
    res.json({ status: "success", data: delivery });
  } catch (err) {
    res.status(400).json({ status: "error", message: err.message });
  }
});

// GET DELIVERY
router.get("/deliveries/:id", async (req, res) => {
  try {
    const delivery = await GetDeliveryUseCase.execute(req.params.id);
    res.json({ status: "success", data: delivery });
  } catch (err) {
    res.status(404).json({ status: "error", message: err.message });
  }
});

module.exports = router;
