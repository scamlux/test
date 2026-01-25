-- ==========================================
-- AUTHENTICATION & ROLES SCHEMA
-- ==========================================

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ==========================================
-- ROLES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
  ('ADMIN', 'Administrator with full access'),
  ('SELLER', 'Seller who can manage products and orders'),
  ('BUYER', 'Customer who can browse and purchase products'),
  ('DELIVERY_AGENT', 'Delivery person who manages deliveries')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- USER ROLES MAPPING
-- ==========================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- ==========================================
-- AUDIT LOG (Track all actions by users)
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ==========================================
-- SESSION/REFRESH TOKEN TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ==========================================
-- EXTEND USERS TABLE - Add seller info
-- ==========================================
CREATE TABLE IF NOT EXISTS seller_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  description TEXT,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_products INT DEFAULT 0,
  total_sales INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- EXTEND PRODUCTS - Add seller reference
-- ==========================================
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'PUBLIC';
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);

-- ==========================================
-- EXTEND ORDERS - Add buyer reference & payment status
-- ==========================================
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS notes TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ==========================================
-- EXTEND DELIVERIES - Add delivery agent reference
-- ==========================================
ALTER TABLE IF EXISTS deliveries ADD COLUMN IF NOT EXISTS delivery_agent_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_deliveries_agent_id ON deliveries(delivery_agent_id);

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ==========================================
-- SAMPLE DATA (Development)
-- ==========================================

-- Create sample users with different roles
INSERT INTO users (email, username, password_hash, first_name, last_name, phone, city, status) VALUES
  ('admin@agriplatform.com', 'admin', '$2b$10$admin_hash_placeholder', 'Admin', 'User', '8801234567890', 'Dhaka', 'ACTIVE'),
  ('seller1@agriplatform.com', 'farmerali', '$2b$10$seller_hash_placeholder', 'Ali', 'Farmer', '8809876543210', 'Bogra', 'ACTIVE'),
  ('seller2@agriplatform.com', 'farmerfatima', '$2b$10$seller_hash_placeholder', 'Fatima', 'Khan', '8801111111111', 'Sylhet', 'ACTIVE'),
  ('buyer1@agriplatform.com', 'customerrahul', '$2b$10$buyer_hash_placeholder', 'Rahul', 'Singh', '8802222222222', 'Dhaka', 'ACTIVE'),
  ('buyer2@agriplatform.com', 'customerpriya', '$2b$10$buyer_hash_placeholder', 'Priya', 'Verma', '8803333333333', 'Chittagong', 'ACTIVE'),
  ('delivery@agriplatform.com', 'deliveryagent', '$2b$10$delivery_hash_placeholder', 'Delivery', 'Agent', '8804444444444', 'Dhaka', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- Assign roles to users
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'admin@agriplatform.com' AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'seller1@agriplatform.com' AND r.name = 'SELLER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'seller2@agriplatform.com' AND r.name = 'SELLER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'buyer1@agriplatform.com' AND r.name = 'BUYER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'buyer2@agriplatform.com' AND r.name = 'BUYER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r 
WHERE u.email = 'delivery@agriplatform.com' AND r.name = 'DELIVERY_AGENT'
ON CONFLICT DO NOTHING;

-- Create seller profiles
INSERT INTO seller_profiles (user_id, shop_name, description, verified) 
SELECT id, 'Ali''s Fresh Farm', 'Organic vegetables and grains', true FROM users WHERE email = 'seller1@agriplatform.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO seller_profiles (user_id, shop_name, description, verified)
SELECT id, 'Fatima''s Organic Store', 'Premium organic produce', true FROM users WHERE email = 'seller2@agriplatform.com'
ON CONFLICT (user_id) DO NOTHING;
