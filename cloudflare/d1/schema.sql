-- Cloudflare D1 Edge Database Schema
-- Optimized for read-heavy hotel booking operations

-- Cache table for API responses
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_cache_expires ON cache(expires_at);

-- Hotel search cache with faster lookups
CREATE TABLE IF NOT EXISTS hotel_search_cache (
  query_hash TEXT PRIMARY KEY,
  results TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_search_expires ON hotel_search_cache(expires_at);

-- Hotels table for quick searches
CREATE TABLE IF NOT EXISTS hotels (
  hotel_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  rating REAL,
  price_min INTEGER,
  amenities TEXT,
  cached_data TEXT,
  updated_at INTEGER
);

CREATE INDEX idx_hotels_city ON hotels(city);
CREATE INDEX idx_hotels_rating ON hotels(rating DESC);
CREATE INDEX idx_hotels_price ON hotels(price_min);

-- User preferences for personalization
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  preferences TEXT,
  updated_at INTEGER
);

-- Booking drafts for auto-save
CREATE TABLE IF NOT EXISTS booking_drafts (
  user_id TEXT,
  hotel_id TEXT,
  draft_data TEXT,
  created_at INTEGER,
  expires_at INTEGER,
  PRIMARY KEY (user_id, hotel_id)
);

CREATE INDEX idx_drafts_expires ON booking_drafts(expires_at);

-- Payment intents for edge processing
CREATE TABLE IF NOT EXISTS payment_intents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  booking_id TEXT,
  hotel_id TEXT,
  amount INTEGER NOT NULL,
  commission INTEGER,
  net_amount INTEGER,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  square_payment_id TEXT,
  created_at INTEGER,
  updated_at INTEGER,
  idempotency_key TEXT UNIQUE
);

CREATE INDEX idx_payment_user ON payment_intents(user_id);
CREATE INDEX idx_payment_status ON payment_intents(status);
CREATE INDEX idx_payment_idempotency ON payment_intents(idempotency_key);

-- Rate limiting violations
CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL,
  path TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_violations_ip ON rate_limit_violations(ip, timestamp);

-- Request logs for analytics
CREATE TABLE IF NOT EXISTS request_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,
  method TEXT NOT NULL,
  response_time INTEGER,
  status_code INTEGER,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_logs_timestamp ON request_logs(timestamp DESC);

-- Cache statistics
CREATE TABLE IF NOT EXISTS cache_stats (
  date TEXT,
  operation TEXT,
  count INTEGER DEFAULT 0,
  last_key TEXT,
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (date, operation)
);

-- Payment audit log
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT,
  event_type TEXT,
  data TEXT,
  created_at INTEGER
);

CREATE INDEX idx_audit_payment ON payment_audit_log(payment_id);

-- Refunds tracking
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at INTEGER
);

CREATE INDEX idx_refunds_payment ON refunds(payment_id);

-- Commission adjustments
CREATE TABLE IF NOT EXISTS commission_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  created_at INTEGER
);

CREATE INDEX idx_commission_payment ON commission_adjustments(payment_id);

-- Popular destinations cache
CREATE TABLE IF NOT EXISTS popular_destinations (
  city TEXT PRIMARY KEY,
  country TEXT,
  search_count INTEGER DEFAULT 0,
  avg_rating REAL,
  avg_price INTEGER,
  top_hotels TEXT,
  updated_at INTEGER
);

CREATE INDEX idx_popular_count ON popular_destinations(search_count DESC);

-- Recently viewed hotels
CREATE TABLE IF NOT EXISTS recently_viewed (
  user_id TEXT,
  hotel_id TEXT,
  viewed_at INTEGER,
  PRIMARY KEY (user_id, hotel_id)
);

CREATE INDEX idx_recent_user ON recently_viewed(user_id, viewed_at DESC);

-- Feature flags for A/B testing
CREATE TABLE IF NOT EXISTS feature_flags (
  flag_name TEXT PRIMARY KEY,
  enabled INTEGER DEFAULT 0,
  percentage INTEGER DEFAULT 0,
  metadata TEXT,
  updated_at INTEGER
);

-- Session tokens (backup for KV)
CREATE TABLE IF NOT EXISTS session_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data TEXT,
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_session_user ON session_tokens(user_id);
CREATE INDEX idx_session_expires ON session_tokens(expires_at);