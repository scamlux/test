import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  RefreshCw,
  Edit2,
  Save,
  X,
} from "lucide-react";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalProducts: 0,
    totalDeliveries: 0,
    totalRevenue: 0,
  });

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editingStatus, setEditingStatus] = useState("");
  const [user, setUser] = useState(null);

  // Get user from localStorage
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats from real database
      const statsRes = await fetch("http://localhost:8000/api/v2/dashboard", {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      if (!statsRes.ok) throw new Error("Failed to fetch stats");
      const statsData = await statsRes.json();
      setStats(statsData.data || {});

      // Fetch orders
      const ordersRes = await fetch("http://localhost:8000/api/v2/orders", {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      if (!ordersRes.ok) throw new Error("Failed to fetch orders");
      const ordersData = await ordersRes.json();
      setOrders(ordersData.data || []);

      // Fetch products
      const productsRes = await fetch("http://localhost:8000/api/v2/products", {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
      });

      if (!productsRes.ok) throw new Error("Failed to fetch products");
      const productsData = await productsRes.json();
      setProducts(productsData.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v2/orders/${orderId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.reason || errorData.error || "Failed to update order",
        );
      }

      // Refresh data after update
      await fetchAllData();
      setEditingOrderId(null);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "#f59e0b",
      CONFIRMED: "#3b82f6",
      SHIPPED: "#8b5cf6",
      DELIVERED: "#10b981",
      CANCELLED: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  const canUpdateStatus = (order) => {
    if (!user) return false;

    // ADMIN can update any order
    if (user.roles && user.roles.includes("ADMIN")) return true;

    // SELLER can update orders containing their products
    if (user.roles && user.roles.includes("SELLER")) {
      return (
        order.items && order.items.some((item) => item.sellerId === user.id)
      );
    }

    // BUYER can cancel their own orders
    if (user.roles && user.roles.includes("BUYER")) {
      return order.buyer_id === user.id;
    }

    return false;
  };

  const summaryCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders || 0,
      icon: Package,
      bgGradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Completed",
      value: stats.completedOrders || 0,
      icon: CheckCircle2,
      bgGradient: "from-green-500 to-green-600",
    },
    {
      title: "Pending",
      value: stats.pendingOrders || 0,
      icon: Clock,
      bgGradient: "from-yellow-500 to-yellow-600",
    },
    {
      title: "Deliveries",
      value: stats.totalDeliveries || 0,
      icon: Truck,
      bgGradient: "from-purple-500 to-purple-600",
    },
  ];

  const completionRate =
    stats.totalOrders > 0
      ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(0)
      : 0;

  return (
    <div className="dashboard-modern">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">🌾 Agri Platform</h1>
            <p className="header-subtitle">
              Real-time Order & Delivery Management
            </p>
          </div>
          <div className="header-actions">
            {error && (
              <div className="error-banner">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="btn-refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Summary Cards */}
        <div className="summary-grid">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="summary-card">
                <div className="card-content">
                  <div className="card-text">
                    <p className="card-label">{card.title}</p>
                    <p className="card-value">{card.value.toLocaleString()}</p>
                  </div>
                  <div
                    className={`card-icon bg-gradient-to-br ${card.bgGradient}`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs-nav">
            {[
              { id: "overview", label: "Overview", icon: "📊" },
              { id: "orders", label: "Orders", icon: "📦" },
              { id: "products", label: "Products", icon: "🌾" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="tab-content">
              <div className="overview-grid">
                {/* Order Status Distribution */}
                <div className="card-panel">
                  <h2 className="panel-title">Order Status Distribution</h2>
                  <div className="status-distribution">
                    <div className="status-item">
                      <div className="status-bar">
                        <div
                          className="bar-segment"
                          style={{
                            width: `${completionRate}%`,
                            backgroundColor: "#10b981",
                          }}
                        ></div>
                      </div>
                      <div className="status-label">
                        <span>Completed Orders</span>
                        <span className="status-percent">
                          {completionRate}%
                        </span>
                      </div>
                      <p className="status-count">
                        {stats.completedOrders} of {stats.totalOrders}
                      </p>
                    </div>

                    <div className="status-item">
                      <div className="status-bar">
                        <div
                          className="bar-segment"
                          style={{
                            width: `${stats.totalOrders > 0 ? ((stats.pendingOrders / stats.totalOrders) * 100).toFixed(0) : 0}%`,
                            backgroundColor: "#f59e0b",
                          }}
                        ></div>
                      </div>
                      <div className="status-label">
                        <span>Pending Orders</span>
                        <span className="status-percent">
                          {stats.totalOrders > 0
                            ? (
                                (stats.pendingOrders / stats.totalOrders) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                      <p className="status-count">
                        {stats.pendingOrders} pending
                      </p>
                    </div>

                    <div className="status-item">
                      <div className="status-bar">
                        <div
                          className="bar-segment"
                          style={{
                            width: `${stats.totalOrders > 0 ? ((stats.shippedOrders / stats.totalOrders) * 100).toFixed(0) : 0}%`,
                            backgroundColor: "#8b5cf6",
                          }}
                        ></div>
                      </div>
                      <div className="status-label">
                        <span>Shipped Orders</span>
                        <span className="status-percent">
                          {stats.totalOrders > 0
                            ? (
                                (stats.shippedOrders / stats.totalOrders) *
                                100
                              ).toFixed(0)
                            : 0}
                          %
                        </span>
                      </div>
                      <p className="status-count">
                        {stats.shippedOrders} shipped
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders from DB */}
                <div className="card-panel">
                  <h2 className="panel-title">Recent Orders</h2>
                  <div className="activity-list">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="activity-item">
                        <div
                          className="activity-icon"
                          style={{
                            backgroundColor: getStatusColor(order.status),
                          }}
                        >
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div className="activity-content">
                          <p className="activity-title">
                            Order {order.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="activity-time">
                            {order.buyer_name || "Customer"} -{" "}
                            {order.items?.length || 0} items
                          </p>
                        </div>
                        <span
                          className={`status-badge ${order.status.toLowerCase()}`}
                          style={{
                            backgroundColor: getStatusColor(order.status),
                          }}
                        >
                          {order.status}
                        </span>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        No orders yet
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="tab-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-mono text-sm">
                          {order.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td>{order.buyer_name || "N/A"}</td>
                        <td>{order.items?.length || 0}</td>
                        <td>${(order.total_amount || 0).toFixed(2)}</td>
                        <td>
                          {editingOrderId === order.id ? (
                            <select
                              value={editingStatus}
                              onChange={(e) => setEditingStatus(e.target.value)}
                              className="px-2 py-1 border rounded"
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          ) : (
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: getStatusColor(order.status),
                              }}
                            >
                              {order.status}
                            </span>
                          )}
                        </td>
                        <td className="text-sm text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          {canUpdateStatus(order) ? (
                            <div className="flex gap-2">
                              {editingOrderId === order.id ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateOrderStatus(
                                        order.id,
                                        editingStatus,
                                      )
                                    }
                                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                                    title="Save"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingOrderId(null)}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingOrderId(order.id);
                                    setEditingStatus(order.status);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              No permission
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No orders found
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="tab-content">
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-header">
                      <h3 className="product-name">{product.name}</h3>
                      <span className="product-sku">{product.sku}</span>
                    </div>
                    <p className="product-description">
                      {product.description || "No description"}
                    </p>
                    <div className="product-meta">
                      <div className="meta-item">
                        <span className="meta-label">Price:</span>
                        <span className="meta-value">
                          ${product.price?.toFixed(2)}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Stock:</span>
                        <span className="meta-value">
                          {product.stock_quantity}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Seller:</span>
                        <span className="meta-value">
                          {product.seller_name || "Admin"}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Status:</span>
                        <span className="meta-value">{product.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {products.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No products found
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
