// ===================================
// DOMAIN LAYER - Repository Interface
// ===================================
class IProductRepository {
  async save(product) {
    throw new Error("Not implemented");
  }

  async findById(id) {
    throw new Error("Not implemented");
  }

  async findBySku(sku) {
    throw new Error("Not implemented");
  }

  async findAll() {
    throw new Error("Not implemented");
  }

  async delete(id) {
    throw new Error("Not implemented");
  }
}

module.exports = IProductRepository;
