const store = require("../readStore");
const log = require("../../shared/logger");

module.exports = async function handleOrderCreated(event) {
  store.createOrder(event.orderId, event.payload);
  log("Query", event.orderId, "Read model: Order CREATED");
};
