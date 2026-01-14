const log = require("../../shared/logger");

module.exports = async function handleInventoryReserved(event, producer) {
  log("Payment", event.orderId, "Payment FAILED");

  await producer.send({
    topic: "payment.failed",
    messages: [
      {
        value: JSON.stringify({
          eventType: "PaymentFailed",
          orderId: event.orderId,
          reason: "Insufficient funds",
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
};
