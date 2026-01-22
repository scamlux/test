import React, { useState } from "react";
import { useProductStore } from "../store";
import "./ProductList.css";

export default function ProductList() {
  const { products, loading, error, deleteProduct } = useProductStore();
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      await deleteProduct(id);
    }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="product-list">
      <div className="header">
        <h2>Products</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add Product"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}
      {showForm && <ProductForm onClose={() => setShowForm(false)} />}

      <div className="products-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <h3>{product.name}</h3>
            <p className="sku">SKU: {product.sku}</p>
            <p className="description">{product.description}</p>
            <div className="price-stock">
              <span className="price">${product.price}</span>
              <span className="stock">Stock: {product.stockQuantity}</span>
            </div>
            <div className="actions">
              <button className="btn btn-sm">Edit</button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleDelete(product.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !showForm && (
        <div className="empty">No products yet. Create one to get started!</div>
      )}
    </div>
  );
}

function ProductForm({ onClose }) {
  const { createProduct } = useProductStore();
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct({
        ...formData,
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
      });
      onClose();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="SKU"
        required
        value={formData.sku}
        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
      />
      <input
        type="text"
        placeholder="Product Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
      />
      <input
        type="number"
        placeholder="Price"
        required
        step="0.01"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
      />
      <input
        type="number"
        placeholder="Stock Quantity"
        required
        value={formData.stockQuantity}
        onChange={(e) =>
          setFormData({ ...formData, stockQuantity: e.target.value })
        }
      />
      <button type="submit" className="btn btn-primary">
        Create Product
      </button>
    </form>
  );
}
