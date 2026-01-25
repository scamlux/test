import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/ProductList";
import OrderForm from "./pages/OrderForm";
import RequestLogs from "./pages/RequestLogs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";

// Protected Route Component
function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      setIsAuthenticated(!!token);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="loading-page">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setUser(JSON.parse(userData));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <div className="app">
        {isAuthenticated && (
          <nav className="navbar">
            <div className="nav-container">
              <Link to="/dashboard" className="nav-brand">
                🌾 Agri Platform
              </Link>
              <ul className="nav-menu">
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link to="/products">Products</Link>
                </li>
                <li>
                  <Link to="/orders">Create Order</Link>
                </li>
                <li>
                  <Link to="/logs">Request Logs</Link>
                </li>
              </ul>
              <div className="user-menu">
                <span className="user-info">
                  👤 {user?.firstName || user?.username}
                  {user?.roles && <small>({user.roles[0]})</small>}
                </span>
                <button className="btn-logout" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </nav>
        )}

        <main className={`main-content ${!isAuthenticated ? "auth-main" : ""}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <RequestLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <Navigate
                  to={isAuthenticated ? "/dashboard" : "/login"}
                  replace
                />
              }
            />
          </Routes>
        </main>

        {isAuthenticated && (
          <footer className="footer">
            <p>
              Agri Platform v2.0 • Production Ready • Microservices with Auth
            </p>
          </footer>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
