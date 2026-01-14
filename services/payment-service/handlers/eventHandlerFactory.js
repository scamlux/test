const inventoryReservedHandler = require("./inventoryReservedHandler");

module.exports = function getHandler(eventType) {
  if (eventType === "InventoryReserved") {
    return inventoryReservedHandler;
  }
};
