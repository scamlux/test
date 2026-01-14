require("../shared/otel");

const { Kafka } = require("kafkajs");
const getHandler = require("./handlers/eventHandlerFactory");
const retry = require("../shared/retry");

const kafka = new Kafka({
  clientId: "inventory-service",
  brokers: ["localhost:19092"],
});

const consumer = kafka.consumer({ groupId: "inventory-group" });
const producer = kafka.producer();

async function run() {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({ topic: "order.created", fromBeginning: true });
  await consumer.subscribe({ topic: "payment.failed", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      const handler = getHandler(event.eventType);
      if (!handler) return;
      await retry(() => handler(event, producer));
    },
  });
}

run().catch(console.error);
