require("../shared/otel");

const { Kafka } = require("kafkajs");
const getHandler = require("./handlers/eventHandlerFactory");

const kafka = new Kafka({
  clientId: "payment-service",
  brokers: (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

const consumer = kafka.consumer({ groupId: "payment-group" });
const producer = kafka.producer();

async function run() {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({
    topic: "inventory.reserved",
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      const handler = getHandler(event.eventType);
      if (handler) await handler(event, producer);
    },
  });
}

run().catch(console.error);
