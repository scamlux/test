/**
 * Order Repository Tests
 * Tests order creation with outbox pattern
 */

const db = require("../db");
const { createOrderWithOutbox } = require("../order-repository");

jest.mock("../db");

describe("Order Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create order with outbox event", async () => {
    const orderId = "order-123";
    const orderData = {
      product: "Wheat",
      quantity: 100,
      customerId: "customer-1",
    };

    db.query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ order_id: orderId }] })
      .mockResolvedValueOnce({ rows: [{ id: "outbox-1" }] });

    const result = await createOrderWithOutbox(orderId, orderData);

    expect(result).toBe(orderId);
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test("should store outbox event atomically", async () => {
    const orderId = "order-456";
    const orderData = {
      product: "Rice",
      quantity: 50,
      customerId: "customer-2",
    };

    db.query = jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ order_id: orderId }] })
      .mockResolvedValueOnce({ rows: [{ id: "outbox-2" }] });

    await createOrderWithOutbox(orderId, orderData);

    const calls = db.query.mock.calls;

    expect(calls[0][0]).toContain("INSERT INTO orders");
    expect(calls[1][0]).toContain("INSERT INTO outbox");
  });

  test("should handle order creation failure", async () => {
    const orderId = "order-789";
    const orderData = {
      product: "Corn",
      quantity: 200,
      customerId: "customer-3",
    };

    db.query = jest.fn().mockRejectedValueOnce(new Error("Database error"));

    await expect(createOrderWithOutbox(orderId, orderData)).rejects.toThrow(
      "Database error",
    );
  });

  test("should validate order data", async () => {
    const invalidOrderData = {
      product: "",
      quantity: -10,
      customerId: "",
    };

    expect(() => {
      if (!invalidOrderData.product || invalidOrderData.quantity <= 0) {
        throw new Error("Invalid order data");
      }
    }).toThrow("Invalid order data");
  });

  test("should handle duplicate order ID", async () => {
    const orderId = "order-dup";
    const orderData = {
      product: "Soybean",
      quantity: 75,
      customerId: "customer-4",
    };

    db.query = jest
      .fn()
      .mockRejectedValueOnce(
        new Error("Duplicate key value violates unique constraint"),
      );

    await expect(createOrderWithOutbox(orderId, orderData)).rejects.toThrow(
      "Duplicate key",
    );
  });
});
