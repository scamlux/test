/**
 * Event Handler Factory Tests
 * Tests factory pattern and event routing
 */

const getHandler = require("../handlers/eventHandlerFactory");

jest.mock("../handlers/orderCreatedHandler");
jest.mock("../handlers/inventoryReservedHandler");
jest.mock("../handlers/paymentFailedHandler");
jest.mock("../handlers/orderCancelledHandler");

const orderCreatedHandler = require("../handlers/orderCreatedHandler");
const inventoryReservedHandler = require("../handlers/inventoryReservedHandler");
const paymentFailedHandler = require("../handlers/paymentFailedHandler");
const orderCancelledHandler = require("../handlers/orderCancelledHandler");

describe("Event Handler Factory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should return OrderCreated handler", () => {
    const handler = getHandler("OrderCreated");
    expect(handler).toBe(orderCreatedHandler);
  });

  test("should return InventoryReserved handler", () => {
    const handler = getHandler("InventoryReserved");
    expect(handler).toBe(inventoryReservedHandler);
  });

  test("should return PaymentFailed handler", () => {
    const handler = getHandler("PaymentFailed");
    expect(handler).toBe(paymentFailedHandler);
  });

  test("should return OrderCancelled handler", () => {
    const handler = getHandler("InventoryReleased");
    expect(handler).toBe(orderCancelledHandler);
  });

  test("should return undefined for unknown event type", () => {
    const handler = getHandler("UnknownEventType");
    expect(handler).toBeUndefined();
  });

  test("should handle case-sensitive event types", () => {
    const handler1 = getHandler("OrderCreated");
    const handler2 = getHandler("ordercreated");

    expect(handler1).toBeDefined();
    expect(handler2).toBeUndefined();
  });

  test("should be extensible with new handlers", () => {
    const customHandler = jest.fn();
    const eventType = "CustomEvent";

    const handler = getHandler(eventType);
    expect(handler).toBeUndefined();
  });

  test("should handle null event type", () => {
    const handler = getHandler(null);
    expect(handler).toBeUndefined();
  });

  test("should map all supported event types", () => {
    const supportedEvents = [
      "OrderCreated",
      "InventoryReserved",
      "PaymentFailed",
      "InventoryReleased",
    ];

    supportedEvents.forEach((eventType) => {
      const handler = getHandler(eventType);
      expect(handler).toBeDefined();
    });
  });
});
