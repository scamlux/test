const store = require("../readStore");
const log = require("../../shared/logger");

module.exports = async function handleOrderCancelled(event) {
  store.cancelOrder(event.orderId);
  log("Query", event.orderId, "Read model: Order CANCELLED");
};
