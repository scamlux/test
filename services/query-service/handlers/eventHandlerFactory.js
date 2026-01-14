const orderCreatedHandler = require("./orderCreatedHandler");
const inventoryReservedHandler = require("./inventoryReservedHandler");
const paymentFailedHandler = require("./paymentFailedHandler");
const orderCancelledHandler = require("./orderCancelledHandler");

module.exports = function getHandler(eventType) {
  const handlers = {
    OrderCreated: orderCreatedHandler,
    InventoryReserved: inventoryReservedHandler,
    PaymentFailed: paymentFailedHandler,
    InventoryReleased: orderCancelledHandler,
  };

  return handlers[eventType];
};
