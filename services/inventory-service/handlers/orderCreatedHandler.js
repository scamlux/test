const log = require("../../shared/logger");

module.exports = async function handleOrderCreated(event, producer) {
  log("Inventory", event.orderId, "Inventory RESERVED");

  await producer.send({
    topic: "inventory.reserved",
    messages: [
      {
        value: JSON.stringify({
          eventType: "InventoryReserved",
          orderId: event.orderId,
          timestamp: new Date().toISOString(),
        }),
      },
    ],
  });
};
