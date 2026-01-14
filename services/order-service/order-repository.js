const pool = require("./db");
const { v4: uuid } = require("uuid");

async function createOrderWithOutbox(payload) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const orderId = uuid();

    await client.query(
      "INSERT INTO orders (id, payload, status) VALUES ($1, $2, $3)",
      [orderId, payload, "CREATED"]
    );

    await client.query(
      `INSERT INTO outbox_events 
       (id, aggregate_id, event_type, payload) 
       VALUES ($1, $2, $3, $4)`,
      [
        uuid(),
        orderId,
        "OrderCreated",
        JSON.stringify({
          eventType: "OrderCreated",
          orderId,
          payload,
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    await client.query("COMMIT");
    return orderId;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createOrderWithOutbox,
};
