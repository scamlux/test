/**
 * Order Service
 * - Write model (PostgreSQL)
 * - Real Outbox Pattern
 * - Saga orchestration (producer)
 * - Rate limiting (429)
 * - Idempotency
 * - Kafka integration
 */

require("../shared/otel"); // OpenTelemetry MUST be first

const express = require("express");
const { Kafka } = require("kafkajs");
const rateLimiter = require("./rateLimiter");
const { isProcessed, markProcessed } = require("./idempotencyStore");
const { createOrderWithOutbox } = require("./order-repository");
const publishOutboxEvents = require("./outbox-publisher");
const getHandler = require("./handlers/eventHandlerFactory");
const log = require("../shared/logger");

const app = express();
app.use(express.json());
app.use(rateLimiter);

// =======================
// Kafka setup
// =======================
const kafka = new Kafka({
  clientId: "order-service",
  brokers: ["localhost:19092"],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "order-service-group" });

// =======================
// Kafka init
// =======================
async function startKafka() {
  await producer.connect();
  await consumer.connect();

  // Listen for compensation events
  await consumer.subscribe({
    topic: "inventory.released",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      const handler = getHandler(event.eventType);

      if (handler) {
        await handler(event);
      }
    },
  });

  log("Order", "-", "Kafka producer & consumer connected");
}

startKafka().catch(console.error);

// =======================
// REST API
// =======================
app.post("/orders", async (req, res) => {
  try {
    // -------- Idempotency --------
    const idemKey = req.headers["idempotency-key"];
    if (idemKey) {
      if (isProcessed(idemKey)) {
        return res.status(200).json({
          message: "Duplicate request ignored",
        });
      }
      markProcessed(idemKey);
    }

    // -------- Write + Outbox (transactional) --------
    const orderId = await createOrderWithOutbox(req.body);

    log("Order", orderId, "Order persisted + outbox event created");

    return res.status(202).json({
      message: "Order accepted",
      orderId,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Order creation failed",
    });
  }
});

// =======================
// Outbox publisher (background worker)
// =======================
setInterval(async () => {
  try {
    await publishOutboxEvents(producer);
  } catch (err) {
    console.error("Outbox publish error", err);
  }
}, 3000);

// =======================
// Server start
// =======================
app.listen(8001, () => {
  console.log("Order Service running on port 8001");
});
// ci-cd test commit
