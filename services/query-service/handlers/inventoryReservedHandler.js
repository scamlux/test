const store = require("../readStore");
const log = require("../../shared/logger");

module.exports = async function handleInventoryReserved(event) {
  store.reserveInventory(event.orderId);
  log("Query", event.orderId, "Read model: Inventory RESERVED");
};
