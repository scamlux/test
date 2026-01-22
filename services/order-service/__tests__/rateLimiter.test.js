/**
 * Rate Limiter Tests
 * Tests token bucket rate limiting
 */

const rateLimiter = require("../rateLimiter");

describe("Rate Limiter", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      ip: "192.168.1.1",
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("should allow requests within limit", () => {
    for (let i = 0; i < 5; i++) {
      rateLimiter(req, res, next);
    }

    expect(next).toHaveBeenCalledTimes(5);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("should reject request exceeding limit (429)", () => {
    for (let i = 0; i < 6; i++) {
      rateLimiter(req, res, next);
    }

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Too many requests",
      }),
    );
  });

  test("should track requests per IP", () => {
    const ip1 = "192.168.1.1";
    const ip2 = "192.168.1.2";

    const req1 = { ip: ip1 };
    const req2 = { ip: ip2 };

    for (let i = 0; i < 5; i++) {
      rateLimiter(req1, res, next);
    }

    res.status.mockClear();
    next.mockClear();

    for (let i = 0; i < 5; i++) {
      rateLimiter(req2, res, next);
    }

    expect(next).toHaveBeenCalledTimes(5);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("should handle different IPs independently", () => {
    const ips = ["10.0.0.1", "10.0.0.2", "10.0.0.3"];

    ips.forEach((ip) => {
      const request = { ip };
      for (let i = 0; i < 5; i++) {
        rateLimiter(request, res, next);
      }
    });

    expect(next).toHaveBeenCalledTimes(15);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("should enforce limit strictly", () => {
    const req = { ip: "192.168.1.5" };

    for (let i = 0; i < 5; i++) {
      rateLimiter(req, res, next);
    }

    rateLimiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
  });
});
