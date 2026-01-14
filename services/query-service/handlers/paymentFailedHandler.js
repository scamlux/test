const store = require("../readStore");
const log = require("../../shared/logger");

module.exports = async function handlePaymentFailed(event) {
  store.paymentFailed(event.orderId);
  log("Query", event.orderId, "Read model: Payment FAILED");
};
