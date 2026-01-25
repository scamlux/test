const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "orders_user",
  password: process.env.DB_PASSWORD || "orders_pass",
  database: process.env.DB_NAME || "orders_db",
});

module.exports = pool;
