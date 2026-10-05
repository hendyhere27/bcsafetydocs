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
