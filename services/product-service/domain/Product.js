// ===================================
// DOMAIN LAYER - Product Entity
// ===================================
class Product {
  constructor(
    id,
    sku,
    name,
    description,
    price,
    stockQuantity,
    status = "ACTIVE",
  ) {
    this.id = id;
    this.sku = sku;
    this.name = name;
    this.description = description;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static create(sku, name, description, price, stockQuantity) {
    const { v4: uuid } = require("uuid");
    return new Product(uuid(), sku, name, description, price, stockQuantity);
  }

  reserveStock(quantity) {
    if (this.stockQuantity < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${this.stockQuantity}, Requested: ${quantity}`,
      );
    }
    this.stockQuantity -= quantity;
    this.updatedAt = new Date();
  }

  releaseStock(quantity) {
    this.stockQuantity += quantity;
    this.updatedAt = new Date();
  }

  updatePrice(newPrice) {
    if (newPrice <= 0) throw new Error("Price must be positive");
    this.price = newPrice;
    this.updatedAt = new Date();
  }

  deactivate() {
    this.status = "INACTIVE";
    this.updatedAt = new Date();
  }

  toDomain() {
    return {
      id: this.id,
      sku: this.sku,
      name: this.name,
      description: this.description,
      price: this.price,
      stockQuantity: this.stockQuantity,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Product;
