const pool = require("pg").Pool;

const pool_instance = new pool({
  user: process.env.DB_USER || "orders_user",
  password: process.env.DB_PASSWORD || "orders_pass",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "orders_db",
});

module.exports = pool_instance;
