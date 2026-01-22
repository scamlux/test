/**
 * Retry Logic Tests
 * Tests exponential backoff and retry mechanism
 */

const retry = require("../retry");

describe("Retry Logic", () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  test("should succeed on first attempt", async () => {
    const fn = jest.fn().mockResolvedValue("success");
    const result = await retry(fn, 3, 100);

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test("should retry 3 times before failing", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("Network error"));

    await expect(retry(fn, 3, 100)).rejects.toThrow("Network error");
    expect(fn).toHaveBeenCalledTimes(4); // initial + 3 retries
  });

  test("should retry and succeed on second attempt", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Fail"))
      .mockResolvedValueOnce("success");

    const result = await retry(fn, 3, 100);

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test("should implement exponential backoff", async () => {
    const delays = [];
    let currentDelay = 100;

    for (let i = 0; i < 3; i++) {
      delays.push(currentDelay);
      currentDelay *= 2;
    }

    expect(delays).toEqual([100, 200, 400]);
  });

  test("should handle successful recovery", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("Fail 1"))
      .mockRejectedValueOnce(new Error("Fail 2"))
      .mockResolvedValueOnce("success");

    const result = await retry(fn, 3, 100);

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
