import React, { useState, useEffect } from "react";
import { useOrderStore, useProductStore } from "../store";
import "./OrderForm.css";

export default function OrderForm() {
  const { createOrder } = useOrderStore();
  const { products, fetchProducts } = useProductStore();
  const [customerId, setCustomerId] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = () => {
    setSelectedProducts([...selectedProducts, { productId: "", quantity: 1 }]);
  };

  const removeProduct = (index) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index, field, value) => {
    const updated = [...selectedProducts];
    updated[index][field] = value;
    setSelectedProducts(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const orderData = {
        customerId,
        items: selectedProducts.map((p) => ({
          productId: p.productId,
          quantity: parseInt(p.quantity),
        })),
      };

      const response = await createOrder(orderData);
      alert(`Order created! ID: ${response.orderId}`);
      setCustomerId("");
      setSelectedProducts([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="order-form-container">
      <h2>Create Order</h2>
      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit} className="order-form">
        <div className="form-group">
          <label>Customer ID</label>
          <input
            type="text"
            placeholder="Enter customer ID"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            required
          />
        </div>

        <div className="products-section">
          <h3>Select Products</h3>
          {selectedProducts.map((item, index) => (
            <div key={index} className="product-row">
              <select
                value={item.productId}
                onChange={(e) =>
                  updateProduct(index, "productId", e.target.value)
                }
                required
              >
                <option value="">Choose product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ${p.price}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  updateProduct(index, "quantity", e.target.value)
                }
              />
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => removeProduct(index)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addProduct}
          >
            + Add Product
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || selectedProducts.length === 0}
        >
          {loading ? "Creating..." : "Create Order"}
        </button>
      </form>
    </div>
  );
}
