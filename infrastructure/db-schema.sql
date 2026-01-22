-- ==========================================
-- PRODUCTS (NEW: Product Aggregate Root)
-- ==========================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- ORDERS (Refactored for DDD)
-- ==========================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- INVENTORY (Reserved items)
-- ==========================================
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'RESERVED',
  reserved_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- DELIVERY (NEW: Delivery Service)
-- ==========================================
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  delivery_date TIMESTAMP,
  expected_delivery_date TIMESTAMP,
  actual_delivery_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- DELIVERY CONFIRMATIONS (NEW)
-- ==========================================
CREATE TABLE IF NOT EXISTS delivery_confirmations (
  id UUID PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  confirmed_at TIMESTAMP DEFAULT NOW(),
  recipient_name VARCHAR(255),
  signature_data TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- REQUEST LOGS (NEW: API Request Logging)
-- ==========================================
CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL,
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  status_code INT,
  request_body JSONB,
  response_body JSONB,
  duration_ms INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- OUTBOX EVENTS (Event Sourcing)
-- ==========================================
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_outbox_sent ON outbox_events(sent, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_order ON inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_service ON request_logs(service_name, created_at);
