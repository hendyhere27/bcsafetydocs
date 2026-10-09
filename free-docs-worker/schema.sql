-- bcsafetydocs-leads: free-download signups, captured by free-docs-worker.
-- One row per download (not per person), so repeat downloads keep their
-- history; unique leads = DISTINCT email. `synced` tracks whether the email
-- has been filed into Resend's "General" segment yet (see README.md).
CREATE TABLE IF NOT EXISTS signups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL,              -- lowercased
  product    TEXT    NOT NULL,              -- PRODUCTS key, e.g. "loto"
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),  -- UTC
  synced     INTEGER NOT NULL DEFAULT 0     -- 1 once filed into Resend General
);
CREATE INDEX IF NOT EXISTS idx_signups_email  ON signups (email);
CREATE INDEX IF NOT EXISTS idx_signups_synced ON signups (synced);

-- FireSmart self-check results (blog/bc-firesmart-assessment-tool.html).
-- Only the first three characters of the postal code (fsa) are stored.
CREATE TABLE IF NOT EXISTS firesmart_assessments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT    NOT NULL,              -- lowercased
  fsa          TEXT    NOT NULL,              -- e.g. "V8W"
  score        INTEGER NOT NULL,
  level        TEXT    NOT NULL,
  answers_json TEXT    NOT NULL,
  ip_hash      TEXT,                          -- truncated SHA-256, rate limiting only
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_fs_email ON firesmart_assessments (email, created_at);
CREATE INDEX IF NOT EXISTS idx_fs_ip    ON firesmart_assessments (ip_hash, created_at);
