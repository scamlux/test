const inventoryReleasedHandler = require("./inventoryReleasedHandler");

function getHandler(eventType) {
  const handlers = {
    InventoryReleased: inventoryReleasedHandler,
  };

  return handlers[eventType];
}

module.exports = getHandler;
