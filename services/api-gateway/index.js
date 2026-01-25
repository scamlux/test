const express = require("express");
const gatewayController = require("./presentation/gatewayController");

const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.use("/api", gatewayController);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.listen(8000, () => {
  console.log("✅ API Gateway running on port 8000");
  console.log("\n📍 Authentication Endpoints:");
  console.log("  POST   /api/auth/register     - Register new user");
  console.log("  POST   /api/auth/login        - Login user");
  console.log("  POST   /api/auth/refresh      - Refresh JWT token");
  console.log("  GET    /api/auth/me           - Get current user");
  console.log("  POST   /api/auth/logout       - Logout user");
  console.log("\n📦 Products Endpoints:");
  console.log("  POST   /api/products          - Create product");
  console.log("  GET    /api/products          - List products");
  console.log("  GET    /api/products/:id      - Get product details");
  console.log("\n📋 Orders Endpoints:");
  console.log("  POST   /api/orders            - Create order");
  console.log("  GET    /api/orders            - List orders");
  console.log("  GET    /api/orders/:id        - Get order details");
  console.log("\n🚚 Delivery Endpoints:");
  console.log("  POST   /api/deliveries        - Create delivery");
  console.log("  GET    /api/deliveries        - List deliveries");
  console.log(
    "\n📊 Real Data Endpoints (v2 - from DB with role-based access):",
  );
  console.log("  GET    /api/v2/dashboard      - Get dashboard stats");
  console.log("  GET    /api/v2/orders         - Get orders (role-filtered)");
  console.log("  POST   /api/v2/orders         - Create new order");
  console.log("  GET    /api/v2/orders/:id     - Get order by ID");
  console.log("  PUT    /api/v2/orders/:id     - Update order status");
  console.log("  GET    /api/v2/products       - Get products");
  console.log("  GET    /api/v2/products/:id   - Get product details");
  console.log("\n📈 Logs Endpoints:");
  console.log("  GET    /api/logs              - View all request logs");
  console.log("  GET    /api/logs/:service     - View service logs");
});
