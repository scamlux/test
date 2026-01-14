const orderCreatedHandler = require("./orderCreatedHandler");
const paymentFailedHandler = require("./paymentFailedHandler");

module.exports = function getHandler(eventType) {
  const handlers = {
    OrderCreated: orderCreatedHandler,
    PaymentFailed: paymentFailedHandler,
  };
  return handlers[eventType];
};
