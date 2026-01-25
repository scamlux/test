const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "agridb",
});

const JWT_SECRET =
  process.env.JWT_SECRET || "your-super-secret-key-change-in-production";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "1h";
const REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || "7d";

// ==========================================
// REGISTER
// ==========================================
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, username, password, firstName, lastName, phone } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email, username, and password are required",
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        status: "error",
        message: "Email or username already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // Create user
    const result = await pool.query(
      `INSERT INTO users (id, email, username, password_hash, first_name, last_name, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
       RETURNING id, email, username, first_name, last_name`,
      [userId, email, username, hashedPassword, firstName, lastName, phone],
    );

    // Assign BUYER role by default
    const buyerRole = await pool.query(
      "SELECT id FROM roles WHERE name = 'BUYER'",
    );

    if (buyerRole.rows.length > 0) {
      await pool.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
        [userId, buyerRole.rows[0].id],
      );
    }

    const user = result.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE },
    );

    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRE,
    });

    // Store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, tokenHash, expiresAt],
    );

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to register user",
      error: err.message,
    });
  }
});

// ==========================================
// LOGIN
// ==========================================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        message: "Email and password are required",
      });
    }

    // Find user
    const result = await pool.query(
      `SELECT u.id, u.email, u.username, u.password_hash, u.first_name, u.last_name, 
              array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.email = $1 AND u.status = 'ACTIVE'
       GROUP BY u.id`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE },
    );

    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRE,
    });

    // Store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
      [user.id, tokenHash, expiresAt],
    );

    res.json({
      status: "success",
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          roles: user.roles,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      status: "error",
      message: "Login failed",
      error: err.message,
    });
  }
});

// ==========================================
// REFRESH TOKEN
// ==========================================
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: "error",
        message: "Refresh token is required",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Generate new access token
    const user = await pool.query(
      `SELECT u.id, u.email, u.username, array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [decoded.userId],
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        status: "error",
        message: "User not found",
      });
    }

    const userData = user.rows[0];

    const accessToken = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        username: userData.username,
        roles: userData.roles,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE },
    );

    res.json({
      status: "success",
      data: { accessToken },
    });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(401).json({
      status: "error",
      message: "Invalid refresh token",
      error: err.message,
    });
  }
});

// ==========================================
// GET CURRENT USER
// ==========================================
app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Authorization header is required",
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await pool.query(
      `SELECT u.id, u.email, u.username, u.first_name, u.last_name, u.phone, u.address, 
              u.city, u.postal_code, u.status, array_agg(r.name) as roles
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       LEFT JOIN roles r ON ur.role_id = r.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [decoded.userId],
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.json({
      status: "success",
      data: user.rows[0],
    });
  } catch (err) {
    console.error("Get current user error:", err);
    res.status(401).json({
      status: "error",
      message: "Invalid token",
      error: err.message,
    });
  }
});

// ==========================================
// VERIFY TOKEN MIDDLEWARE
// ==========================================
app.post("/api/auth/verify", (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Invalid token format",
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      status: "success",
      data: { valid: true, user: decoded },
    });
  } catch (err) {
    res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
      error: err.message,
    });
  }
});

// ==========================================
// LOGOUT
// ==========================================
app.post("/api/auth/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({
        status: "error",
        message: "Authorization header is required",
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    // Revoke all refresh tokens for this user
    await pool.query(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
      [decoded.userId],
    );

    res.json({
      status: "success",
      message: "Logout successful",
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      status: "error",
      message: "Logout failed",
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 8005;
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
