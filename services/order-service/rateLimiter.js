const requests = new Map();
const LIMIT = 5;
const WINDOW_MS = 10_000;

module.exports = function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  if (!requests.has(ip)) requests.set(ip, []);

  const timestamps = requests.get(ip).filter((t) => now - t < WINDOW_MS);

  timestamps.push(now);
  requests.set(ip, timestamps);

  if (timestamps.length > LIMIT) {
    return res.status(429).json({
      error: "Too many requests",
    });
  }

  next();
};
