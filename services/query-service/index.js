require("../shared/otel");

const express = require("express");
const { Kafka } = require("kafkajs");
const getHandler = require("./handlers/eventHandlerFactory");
const store = require("./readStore");

const app = express();

const kafka = new Kafka({
  clientId: "query-service",
  brokers: ["localhost:19092"],
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

// READ API
app.get("/orders", (req, res) => {
  res.json(store.getAllOrders());
});

app.get("/orders/:id", (req, res) => {
  const order = store.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Not found" });
  res.json(order);
});

app.listen(8002, () => console.log("Query service running on port 8002"));
