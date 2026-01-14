const pool = require("./db");
const log = require("../shared/logger");

async function publishOutboxEvents(producer) {
  const res = await pool.query(
    "SELECT * FROM outbox_events WHERE sent = false"
  );

  for (const row of res.rows) {
    await producer.send({
      topic: "order.created",
      messages: [{ value: JSON.stringify(row.payload) }],
    });

    await pool.query("UPDATE outbox_events SET sent = true WHERE id = $1", [
      row.id,
    ]);

    log("Order", row.aggregate_id, "Outbox event published");
  }
}

module.exports = publishOutboxEvents;
