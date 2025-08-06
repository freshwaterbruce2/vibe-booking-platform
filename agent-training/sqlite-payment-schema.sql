-- SQLite Payment System Schema Template
-- Agent Training: Complete payment and subscription database schema

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  paypal_payer_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('card', 'paypal', 'bank')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  provider_payment_method_id TEXT UNIQUE,
  last_four TEXT,
  brand TEXT,
  is_default BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  interval_count INTEGER DEFAULT 1,
  trial_days INTEGER DEFAULT 0,
  features JSON,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  payment_method_id INTEGER,
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'manual')),
  provider_subscription_id TEXT UNIQUE,
  current_period_start DATETIME NOT NULL,
  current_period_end DATETIME NOT NULL,
  trial_end DATETIME,
  cancel_at_period_end BOOLEAN DEFAULT 0,
  canceled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id),
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  subscription_id INTEGER,
  payment_method_id INTEGER,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'manual')),
  provider_payment_id TEXT UNIQUE,
  provider_response JSON,
  description TEXT,
  metadata JSON,
  failure_reason TEXT,
  refunded_amount_cents INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  subscription_id INTEGER,
  payment_id INTEGER,
  invoice_number TEXT UNIQUE NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  tax_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date DATE,
  paid_at DATETIME,
  line_items JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL
);

-- Payment events table (audit trail)
CREATE TABLE IF NOT EXISTS payment_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
);

-- Webhooks table (for idempotency)
CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSON,
  processed BOOLEAN DEFAULT 0,
  processed_at DATETIME,
  error TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at);
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX idx_webhook_events_event_id ON webhook_events(event_id);

-- Triggers for updated_at
CREATE TRIGGER update_customers_timestamp 
AFTER UPDATE ON customers
BEGIN
  UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_subscriptions_timestamp 
AFTER UPDATE ON subscriptions
BEGIN
  UPDATE subscriptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_payments_timestamp 
AFTER UPDATE ON payments
BEGIN
  UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Views for common queries
CREATE VIEW active_subscriptions AS
SELECT 
  s.*,
  c.email,
  c.name,
  p.name as plan_name,
  p.price_cents,
  p.interval
FROM subscriptions s
JOIN customers c ON s.customer_id = c.id
JOIN subscription_plans p ON s.plan_id = p.id
WHERE s.status = 'active';

CREATE VIEW revenue_summary AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as payment_count,
  SUM(CASE WHEN status = 'succeeded' THEN amount_cents ELSE 0 END) as revenue_cents,
  SUM(CASE WHEN status = 'refunded' THEN refunded_amount_cents ELSE 0 END) as refunded_cents
FROM payments
GROUP BY DATE(created_at);

-- Sample queries for agents to reference

-- Get customer's payment history
/*
SELECT 
  p.*,
  pm.type as payment_method_type,
  pm.last_four
FROM payments p
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.customer_id = ?
ORDER BY p.created_at DESC;
*/

-- Check subscription status
/*
SELECT 
  s.*,
  sp.name as plan_name,
  sp.price_cents,
  c.email
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.id
JOIN customers c ON s.customer_id = c.id
WHERE s.id = ?;
*/

-- Revenue report by month
/*
SELECT 
  strftime('%Y-%m', created_at) as month,
  COUNT(*) as transaction_count,
  SUM(CASE WHEN status = 'succeeded' THEN amount_cents ELSE 0 END) / 100.0 as revenue,
  SUM(CASE WHEN status = 'refunded' THEN refunded_amount_cents ELSE 0 END) / 100.0 as refunds
FROM payments
WHERE created_at >= date('now', '-12 months')
GROUP BY strftime('%Y-%m', created_at)
ORDER BY month DESC;
*/