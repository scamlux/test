import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, AlertCircle, Loader } from "lucide-react";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Login failed");
      }

      const data = await response.json();

      // Store tokens in localStorage
      localStorage.setItem("accessToken", data.data.accessToken);
      localStorage.setItem("refreshToken", data.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials for development
  const fillDemoCredentials = (role) => {
    const credentials = {
      admin: { email: "admin@agriplatform.com", password: "admin123" },
      seller: { email: "seller1@agriplatform.com", password: "seller123" },
      buyer: { email: "buyer1@agriplatform.com", password: "buyer123" },
    };
    setFormData(credentials[role] || credentials.buyer);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <LogIn size={40} />
          </div>
          <h1>Agri Platform</h1>
          <p>Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <Loader size={18} className="spinner" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Login
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">OR</div>

        <div className="demo-credentials">
          <p className="demo-label">🧪 Demo Credentials:</p>
          <div className="demo-buttons">
            <button
              type="button"
              onClick={() => fillDemoCredentials("admin")}
              className="demo-btn admin"
              disabled={loading}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials("seller")}
              className="demo-btn seller"
              disabled={loading}
            >
              Seller
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials("buyer")}
              className="demo-btn buyer"
              disabled={loading}
            >
              Buyer
            </button>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
