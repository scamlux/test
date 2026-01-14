const log = require("../../shared/logger");

module.exports = async function handlePaymentFailed(event, producer) {
  log("Inventory", event.orderId, "Inventory RELEASED");

  await producer.send({
    topic: "inventory.released",
    messages: [
      {
        value: JSON.stringify({
          eventType: "InventoryReleased",
          orderId: event.orderId,
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
};
