import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 145,
    completedOrders: 98,
    pendingOrders: 32,
    cancelledOrders: 15,
    totalDeliveries: 87,
    completedDeliveries: 72,
    pendingDeliveries: 15,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/metrics");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Failed to fetch metrics");
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: Package,
      bgGradient: "from-blue-500 to-blue-600",
      change: "+12%",
    },
    {
      title: "Completed",
      value: stats.completedOrders,
      icon: CheckCircle2,
      bgGradient: "from-green-500 to-green-600",
      change: "+8%",
    },
    {
      title: "Pending",
      value: stats.pendingOrders,
      icon: Clock,
      bgGradient: "from-yellow-500 to-yellow-600",
      change: "-5%",
    },
    {
      title: "Deliveries",
      value: stats.totalDeliveries,
      icon: Truck,
      bgGradient: "from-purple-500 to-purple-600",
      change: "+3%",
    },
  ];

  const completionRate =
    stats.totalOrders > 0
      ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(0)
      : 0;

  const deliveryRate =
    stats.totalDeliveries > 0
      ? ((stats.completedDeliveries / stats.totalDeliveries) * 100).toFixed(0)
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
              onClick={fetchData}
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
                    <p className="card-change">{card.change} from last week</p>
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
              { id: "deliveries", label: "Deliveries", icon: "🚚" },
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
                            width: `${deliveryRate}%`,
                            backgroundColor: "#3b82f6",
                          }}
                        ></div>
                      </div>
                      <div className="status-label">
                        <span>Delivered</span>
                        <span className="status-percent">{deliveryRate}%</span>
                      </div>
                      <p className="status-count">
                        {stats.completedDeliveries} of {stats.totalDeliveries}
                      </p>
                    </div>

                    <div className="status-item">
                      <div className="status-bar">
                        <div
                          className="bar-segment"
                          style={{
                            width: `${((stats.pendingOrders / stats.totalOrders) * 100).toFixed(0)}%`,
                            backgroundColor: "#f59e0b",
                          }}
                        ></div>
                      </div>
                      <div className="status-label">
                        <span>Pending Orders</span>
                        <span className="status-percent">
                          {(
                            (stats.pendingOrders / stats.totalOrders) *
                            100
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <p className="status-count">
                        {stats.pendingOrders} pending
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="card-panel">
                  <h2 className="panel-title">Recent Orders</h2>
                  <div className="activity-list">
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <div key={idx} className="activity-item">
                        <div
                          className="activity-icon"
                          style={{
                            backgroundColor: `hsl(${idx * 60}, 70%, 60%)`,
                          }}
                        >
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <div className="activity-content">
                          <p className="activity-title">
                            Order #ORD{String(1000 + idx).slice(-4)}
                          </p>
                          <p className="activity-time">
                            Customer ID: CST{String(5000 + idx).slice(-4)}
                          </p>
                        </div>
                        <span
                          className={`status-badge ${idx % 2 === 0 ? "completed" : "pending"}`}
                        >
                          {idx % 2 === 0 ? "Completed" : "Pending"}
                        </span>
                      </div>
                    ))}
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
                      <th>Status</th>
                      <th>Created</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <tr key={idx}>
                        <td className="font-mono">
                          ORD{String(1000 + idx).slice(-4)}...
                        </td>
                        <td>CST{String(5000 + idx).slice(-4)}</td>
                        <td>
                          <span
                            className={`status-badge ${idx % 2 === 0 ? "completed" : "pending"}`}
                          >
                            {idx % 2 === 0 ? "Completed" : "Pending"}
                          </span>
                        </td>
                        <td>
                          {new Date(
                            Date.now() - idx * 86400000,
                          ).toLocaleDateString()}
                        </td>
                        <td className="action-cell">
                          <button className="icon-button">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Deliveries Tab */}
          {activeTab === "deliveries" && (
            <div className="tab-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Delivery ID</th>
                      <th>Order</th>
                      <th>Status</th>
                      <th>Address</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((idx) => (
                      <tr key={idx}>
                        <td className="font-mono">
                          DEL{String(2000 + idx).slice(-4)}...
                        </td>
                        <td>ORD{String(1000 + idx).slice(-4)}...</td>
                        <td>
                          <span
                            className={`status-badge ${idx % 2 === 0 ? "delivered" : "in-transit"}`}
                          >
                            {idx % 2 === 0 ? "Delivered" : "In Transit"}
                          </span>
                        </td>
                        <td>Street {idx}, City</td>
                        <td className="action-cell">
                          <button className="icon-button">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dashboard-footer">
          <p>
            🔄 Auto-refreshing every 10 seconds | Last updated:{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
