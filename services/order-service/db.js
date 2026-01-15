const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "orders_user",
  password: "orders_pass",
  database: "orders_db",
});


module.exports = pool;




