const pool = require("../infrastructure/database");
const Product = require("./Product");
const IProductRepository = require("./IProductRepository");

class ProductRepository extends IProductRepository {
  async save(product) {
    const domainProduct = product.toDomain ? product.toDomain() : product;

    const result = await pool.query(
      `INSERT INTO products (id, sku, name, description, price, stock_quantity, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (sku) DO UPDATE SET
       name = $3, description = $4, price = $5, stock_quantity = $6, status = $7, updated_at = $9
       RETURNING *`,
      [
        domainProduct.id,
        domainProduct.sku,
        domainProduct.name,
        domainProduct.description,
        domainProduct.price,
        domainProduct.stockQuantity,
        domainProduct.status,
        domainProduct.createdAt,
        domainProduct.updatedAt,
      ],
    );

    return this._rowToProduct(result.rows[0]);
  }

  async findById(id) {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);
    return result.rows.length ? this._rowToProduct(result.rows[0]) : null;
  }

  async findBySku(sku) {
    const result = await pool.query("SELECT * FROM products WHERE sku = $1", [
      sku,
    ]);
    return result.rows.length ? this._rowToProduct(result.rows[0]) : null;
  }

  async findAll() {
    const result = await pool.query(
      "SELECT * FROM products WHERE status = $1 ORDER BY created_at DESC",
      ["ACTIVE"],
    );
    return result.rows.map((row) => this._rowToProduct(row));
  }

  async delete(id) {
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
  }

  _rowToProduct(row) {
    return new Product(
      row.id,
      row.sku,
      row.name,
      row.description,
      row.price,
      row.stock_quantity,
      row.status,
    );
  }
}

module.exports = new ProductRepository();
