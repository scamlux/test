// ===================================
// APPLICATION LAYER - Use Cases
// ===================================

const { v4: uuid } = require("uuid");
const Product = require("../domain/Product");
const productRepository = require("../domain/ProductRepository");
const log = require("../../shared/logger");

class CreateProductUseCase {
  async execute(command) {
    const { sku, name, description, price, stockQuantity } = command;

    const existingProduct = await productRepository.findBySku(sku);
    if (existingProduct) {
      throw new Error(`Product with SKU ${sku} already exists`);
    }

    const product = Product.create(
      sku,
      name,
      description,
      price,
      stockQuantity,
    );
    await productRepository.save(product);

    log("ProductService", product.id, `Product created: ${name}`);
    return product.toDomain();
  }
}

class UpdateProductUseCase {
  async execute(command) {
    const { id, name, description, price, stockQuantity, status } = command;

    const product = await productRepository.findById(id);
    if (!product) {
      throw new Error(`Product ${id} not found`);
    }

    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.updatePrice(price);
    if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
    if (status) product.status = status;

    await productRepository.save(product);
    log("ProductService", id, `Product updated`);
    return product.toDomain();
  }
}

class GetProductUseCase {
  async execute(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    return product.toDomain();
  }
}

class ListProductsUseCase {
  async execute() {
    const products = await productRepository.findAll();
    return products.map((p) => p.toDomain());
  }
}

class DeleteProductUseCase {
  async execute(productId) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    product.deactivate();
    await productRepository.save(product);

    log("ProductService", productId, `Product deactivated`);
  }
}

class ReserveProductStockUseCase {
  async execute(productId, quantity) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    product.reserveStock(quantity);
    await productRepository.save(product);

    return product.toDomain();
  }
}

class ReleaseProductStockUseCase {
  async execute(productId, quantity) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    product.releaseStock(quantity);
    await productRepository.save(product);

    return product.toDomain();
  }
}

module.exports = {
  CreateProductUseCase: new CreateProductUseCase(),
  UpdateProductUseCase: new UpdateProductUseCase(),
  GetProductUseCase: new GetProductUseCase(),
  ListProductsUseCase: new ListProductsUseCase(),
  DeleteProductUseCase: new DeleteProductUseCase(),
  ReserveProductStockUseCase: new ReserveProductStockUseCase(),
  ReleaseProductStockUseCase: new ReleaseProductStockUseCase(),
};
