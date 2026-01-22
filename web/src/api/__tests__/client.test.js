/**
 * API Client Tests
 * Tests HTTP client and API methods
 */

import axios from "axios";
import { productAPI, orderAPI, deliveryAPI, logsAPI } from "../client";

// Mock axios before importing
jest.mock("axios");

// Set up the mock
const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

axios.create.mockReturnValue(mockApiClient);

describe("API Client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Product API", () => {
    test("should get all products", async () => {
      const mockProducts = [
        { id: "1", name: "Wheat" },
        { id: "2", name: "Rice" },
      ];

      mockApiClient.get.mockResolvedValue({ data: mockProducts });

      const result = await productAPI.getAll();
      expect(result.data).toEqual(mockProducts);
    });

    test("should get product by id", async () => {
      const mockProduct = { id: "1", name: "Wheat" };

      mockApiClient.get.mockResolvedValue({ data: mockProduct });

      const result = await productAPI.getById("1");
      expect(result.data).toEqual(mockProduct);
    });

    test("should create product", async () => {
      const newProduct = { name: "Corn", quantity: 100 };

      mockApiClient.post.mockResolvedValue({
        data: { id: "3", ...newProduct },
      });

      const result = await productAPI.create(newProduct);
      expect(result.data.name).toBe("Corn");
    });

    test("should update product", async () => {
      const updatedProduct = { name: "Wheat", quantity: 150 };

      mockApiClient.put.mockResolvedValue({ data: updatedProduct });

      const result = await productAPI.update("1", updatedProduct);
      expect(result.data.quantity).toBe(150);
    });

    test("should delete product", async () => {
      mockApiClient.delete.mockResolvedValue({ status: 204 });

      const result = await productAPI.delete("1");
      expect(result.status).toBe(204);
    });
  });

  describe("Order API", () => {
    test("should get all orders", async () => {
      const mockOrders = [
        { id: "order-1", status: "CREATED" },
        { id: "order-2", status: "COMPLETED" },
      ];

      mockApiClient.get.mockResolvedValue({ data: mockOrders });

      const result = await orderAPI.getAll();
      expect(result.data).toEqual(mockOrders);
    });

    test("should get order by id", async () => {
      const mockOrder = { id: "order-1", status: "CREATED" };

      mockApiClient.get.mockResolvedValue({ data: mockOrder });

      const result = await orderAPI.getById("order-1");
      expect(result.data).toEqual(mockOrder);
    });

    test("should create order", async () => {
      const newOrder = { productId: "1", quantity: 10 };

      mockApiClient.post.mockResolvedValue({
        data: { id: "order-new", ...newOrder },
      });

      const result = await orderAPI.create(newOrder);
      expect(result.data.id).toBe("order-new");
    });
  });

  describe("Delivery API", () => {
    test("should get delivery by id", async () => {
      const mockDelivery = { id: "delivery-1", status: "IN_TRANSIT" };

      mockApiClient.get.mockResolvedValue({ data: mockDelivery });

      const result = await deliveryAPI.getById("delivery-1");
      expect(result.data).toEqual(mockDelivery);
    });

    test("should create delivery", async () => {
      const newDelivery = { orderId: "order-1", destination: "Farm A" };

      mockApiClient.post.mockResolvedValue({
        data: { id: "delivery-new", ...newDelivery },
      });

      const result = await deliveryAPI.create(newDelivery);
      expect(result.data.id).toBe("delivery-new");
    });

    test("should start delivery", async () => {
      mockApiClient.post.mockResolvedValue({ data: { status: "IN_TRANSIT" } });

      const result = await deliveryAPI.start("delivery-1");
      expect(result.data.status).toBe("IN_TRANSIT");
    });

    test("should confirm delivery", async () => {
      const confirmData = { signature: "signature-123" };

      mockApiClient.post.mockResolvedValue({ data: { status: "COMPLETED" } });

      const result = await deliveryAPI.confirm("delivery-1", confirmData);
      expect(result.data.status).toBe("COMPLETED");
    });
  });

  describe("Logs API", () => {
    test("should get all logs", async () => {
      const mockLogs = [
        { id: "1", timestamp: "2024-01-01" },
        { id: "2", timestamp: "2024-01-02" },
      ];

      mockApiClient.get.mockResolvedValue({ data: mockLogs });

      const result = await logsAPI.getAll(100);
      expect(result.data).toEqual(mockLogs);
    });

    test("should get logs by service", async () => {
      const mockLogs = [
        { id: "1", service: "order-service" },
        { id: "2", service: "order-service" },
      ];

      mockApiClient.get.mockResolvedValue({ data: mockLogs });

      const result = await logsAPI.getByService("order-service", 50);
      expect(result.data).toEqual(mockLogs);
    });

    test("should use default limit", async () => {
      mockApiClient.get.mockResolvedValue({ data: [] });

      await logsAPI.getAll();
      expect(mockApiClient.get).toHaveBeenCalledWith("/logs?limit=100");
    });
  });

  describe("Error Handling", () => {
    test("should handle API errors", async () => {
      const error = new Error("API Error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(productAPI.getAll()).rejects.toThrow("API Error");
    });

    test("should handle 404 errors", async () => {
      const error = new Error("Not Found");
      error.response = { status: 404 };

      mockApiClient.get.mockRejectedValue(error);

      await expect(productAPI.getById("999")).rejects.toThrow("Not Found");
    });

    test("should handle network errors", async () => {
      const error = new Error("Network Error");
      error.code = "ECONNREFUSED";

      mockApiClient.post.mockRejectedValue(error);

      await expect(orderAPI.create({})).rejects.toThrow("Network Error");
    });
  });
});
