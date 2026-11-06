CREATE TABLE enquiries (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  request_key TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  data_json TEXT NOT NULL
);
CREATE INDEX enquiries_created ON enquiries(created_at);
CREATE INDEX enquiries_expiry ON enquiries(expires_at);
CREATE INDEX enquiries_fingerprint ON enquiries(payload_hash,created_at);
CREATE TABLE enquiry_rate_limits (
  rate_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  PRIMARY KEY(rate_key,window_start)
);
