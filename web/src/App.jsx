import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/ProductList";
import OrderForm from "./pages/OrderForm";
import RequestLogs from "./pages/RequestLogs";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-brand">
              🌾 Agri Platform
            </Link>
            <ul className="nav-menu">
              <li>
                <Link to="/">Dashboard</Link>
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
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/orders" element={<OrderForm />} />
            <Route path="/logs" element={<RequestLogs />} />
          </Routes>
        </main>

        <footer className="footer">
          <p>Agri Platform v1.0 • Microservices Architecture with DDD</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
