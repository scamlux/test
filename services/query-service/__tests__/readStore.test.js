/**
 * Read Store Tests (CQRS Read Model)
 * Tests event-driven read model updates
 */

const store = require("../readStore");

describe("Read Store (CQRS)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create order in read model", () => {
    const orderId = "order-001";
    const payload = { product: "Wheat", quantity: 100 };

    store.createOrder(orderId, payload);

    const order = store.getOrder(orderId);
    expect(order).toEqual({
      orderId,
      status: "CREATED",
      product: "Wheat",
      quantity: 100,
    });
  });

  test("should update status on inventory reserved", () => {
    const orderId = "order-002";
    const payload = { product: "Rice", quantity: 50 };

    store.createOrder(orderId, payload);
    store.reserveInventory(orderId);

    const order = store.getOrder(orderId);
    expect(order.status).toBe("INVENTORY_RESERVED");
  });

  test("should update status on payment failed", () => {
    const orderId = "order-003";
    const payload = { product: "Corn", quantity: 75 };

    store.createOrder(orderId, payload);
    store.paymentFailed(orderId);

    const order = store.getOrder(orderId);
    expect(order.status).toBe("PAYMENT_FAILED");
  });

  test("should cancel order", () => {
    const orderId = "order-004";
    const payload = { product: "Soybean", quantity: 200 };

    store.createOrder(orderId, payload);
    store.cancelOrder(orderId);

    const order = store.getOrder(orderId);
    expect(order.status).toBe("CANCELLED");
  });

  test("should return all orders", () => {
    store.createOrder("order-101", { product: "Wheat", quantity: 100 });
    store.createOrder("order-102", { product: "Rice", quantity: 50 });
    store.createOrder("order-103", { product: "Corn", quantity: 75 });

    const orders = store.getAllOrders();
    expect(orders.length).toBeGreaterThanOrEqual(3);
  });

  test("should handle non-existent order gracefully", () => {
    const order = store.getOrder("non-existent");
    expect(order).toBeUndefined();
  });

  test("should track multiple order states", () => {
    const orders = [
      { id: "order-a", product: "Product A" },
      { id: "order-b", product: "Product B" },
      { id: "order-c", product: "Product C" },
    ];

    orders.forEach((o) =>
      store.createOrder(o.id, { product: o.product, quantity: 10 }),
    );

    orders.forEach((o) => {
      expect(store.getOrder(o.id)).toBeDefined();
    });
  });
});
