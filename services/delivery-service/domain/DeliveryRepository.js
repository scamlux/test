const pool = require("../infrastructure/database");
const Delivery = require("./Delivery");

class DeliveryRepository {
  async save(delivery) {
    const domainDelivery = delivery.toDomain ? delivery.toDomain() : delivery;

    const result = await pool.query(
      `INSERT INTO deliveries (id, order_id, status, delivery_date, expected_delivery_date, actual_delivery_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
       status = $3, delivery_date = $4, expected_delivery_date = $5, actual_delivery_date = $6, updated_at = $8
       RETURNING *`,
      [
        domainDelivery.id,
        domainDelivery.orderId,
        domainDelivery.status,
        domainDelivery.deliveryDate,
        domainDelivery.expectedDeliveryDate,
        domainDelivery.actualDeliveryDate,
        domainDelivery.createdAt,
        domainDelivery.updatedAt,
      ],
    );

    return this._rowToDelivery(result.rows[0]);
  }

  async findById(id) {
    const result = await pool.query("SELECT * FROM deliveries WHERE id = $1", [
      id,
    ]);
    return result.rows.length ? this._rowToDelivery(result.rows[0]) : null;
  }

  async findByOrderId(orderId) {
    const result = await pool.query(
      "SELECT * FROM deliveries WHERE order_id = $1",
      [orderId],
    );
    return result.rows.length ? this._rowToDelivery(result.rows[0]) : null;
  }

  _rowToDelivery(row) {
    return new Delivery(
      row.id,
      row.order_id,
      row.status,
      row.expected_delivery_date,
      row.actual_delivery_date,
    );
  }
}

module.exports = new DeliveryRepository();
