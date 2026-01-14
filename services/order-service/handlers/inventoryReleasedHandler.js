const log = require("../../shared/logger");

module.exports = async function handleInventoryReleased(event) {
  log("Order", event.orderId, "Order CANCELLED after compensation");
};
