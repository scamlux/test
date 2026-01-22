/**
 * Idempotency Store Tests
 * Tests idempotent request handling
 */

const { isProcessed, markProcessed } = require("../idempotencyStore");

describe("Idempotency Store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should mark key as processed", () => {
    const key = "idempotency-key-1";

    markProcessed(key);

    expect(isProcessed(key)).toBe(true);
  });

  test("should return false for unprocessed key", () => {
    const key = "idempotency-key-2";

    expect(isProcessed(key)).toBe(false);
  });

  test("should track multiple processed keys", () => {
    const keys = ["key-1", "key-2", "key-3"];

    keys.forEach((key) => markProcessed(key));

    keys.forEach((key) => {
      expect(isProcessed(key)).toBe(true);
    });
  });

  test("should handle duplicate idempotency keys", () => {
    const key = "dup-key";

    markProcessed(key);
    markProcessed(key);

    expect(isProcessed(key)).toBe(true);
  });

  test("should prevent duplicate request processing", () => {
    const requestId = "req-123";

    if (!isProcessed(requestId)) {
      markProcessed(requestId);
    }

    expect(isProcessed(requestId)).toBe(true);

    if (!isProcessed(requestId)) {
      expect(false).toBe(true);
    }
  });
});
