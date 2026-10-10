-- bcsafetydocs-leads: free-download signups, captured by free-docs-worker.
-- One row per download (not per person), so repeat downloads keep their
-- history; unique leads = DISTINCT email. `synced` tracks whether the email
-- has been filed into Resend's "General" segment yet (see README.md).
CREATE TABLE IF NOT EXISTS signups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL,              -- lowercased
  product    TEXT    NOT NULL,              -- PRODUCTS key, e.g. "loto"
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),  -- UTC
  synced     INTEGER NOT NULL DEFAULT 0,    -- 1 once filed into Resend General
  marketing_opt_in INTEGER NOT NULL DEFAULT 0  -- 1 only if the optional follow-up box was ticked (added 2026-10-09; existing DBs: ALTER TABLE ... ADD COLUMN)
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
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  marketing_opt_in INTEGER NOT NULL DEFAULT 0 -- added 2026-10-09 (existing DBs: ALTER TABLE ... ADD COLUMN)
);
CREATE INDEX IF NOT EXISTS idx_fs_email ON firesmart_assessments (email, created_at);
CREATE INDEX IF NOT EXISTS idx_fs_ip    ON firesmart_assessments (ip_hash, created_at);

-- COR incentive calculator results (cor-rebate-calculator.html).
-- marketing_opt_in = 1 only if the person ticked the follow-up-emails box (CASL);
-- only those people are also written to `signups` for the Resend sync.
CREATE TABLE IF NOT EXISTS cor_rebate_calcs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  email            TEXT    NOT NULL,          -- lowercased
  payroll          REAL    NOT NULL,
  workers          INTEGER,                   -- optional
  base_rate        REAL    NOT NULL,          -- per $100
  annual_incentive INTEGER NOT NULL,
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  ip_hash          TEXT,                      -- truncated SHA-256, rate limiting only
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cr_email ON cor_rebate_calcs (email, created_at);
CREATE INDEX IF NOT EXISTS idx_cr_ip    ON cor_rebate_calcs (ip_hash, created_at);

-- COR readiness gap check results (cor-gap-check.html).
-- marketing_opt_in = 1 only if the follow-up box was ticked (CASL); only those
-- people are also written to `signups`.
CREATE TABLE IF NOT EXISTS cor_gap_checks (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  email            TEXT    NOT NULL,          -- lowercased
  sector           TEXT    NOT NULL,
  have_count       INTEGER NOT NULL,
  partial_count    INTEGER NOT NULL,
  none_count       INTEGER NOT NULL,
  answers_json     TEXT    NOT NULL,
  marketing_opt_in INTEGER NOT NULL DEFAULT 0,
  ip_hash          TEXT,                      -- truncated SHA-256, rate limiting only
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cg_email ON cor_gap_checks (email, created_at);
CREATE INDEX IF NOT EXISTS idx_cg_ip    ON cor_gap_checks (ip_hash, created_at);

-- COR follow-up sequence (sequence.js): per-address unsubscribe token + the queued
-- emails a daily cron sends (an unsubscribe cancels what is still pending).
CREATE TABLE IF NOT EXISTS sequence_subs (
  email           TEXT PRIMARY KEY,          -- lowercased
  token           TEXT NOT NULL UNIQUE,      -- random 32-hex, used in unsubscribe links
  unsubscribed    INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  unsubscribed_at TEXT
);
CREATE TABLE IF NOT EXISTS sequence_emails (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL,
  kind         TEXT NOT NULL,                  -- rebate | gap
  step         INTEGER NOT NULL,               -- 1..3 (day 2, 5, 10)
  send_at      TEXT NOT NULL,                  -- UTC; the daily cron sends rows that are due
  payload_json TEXT NOT NULL,                  -- { kind, data } used to build the email
  status       TEXT NOT NULL DEFAULT 'pending', -- pending | sent | canceled | failed
  attempts     INTEGER NOT NULL DEFAULT 0,
  last_error   TEXT,
  resend_id    TEXT,
  sent_at      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_seq_email ON sequence_emails (email, status);

-- Call requests from the kit page and thank-you page (handleCallRequest).
-- Not marketing signups: nothing here feeds the Resend list.
CREATE TABLE IF NOT EXISTS call_requests (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,                 -- lowercased
  phone      TEXT,
  topic      TEXT NOT NULL,                 -- question | buyer-offer
  message    TEXT,
  source     TEXT,                          -- page path the form was on
  ip_hash    TEXT,                          -- truncated SHA-256, rate limiting only
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cr2_email ON call_requests (email, created_at);
CREATE INDEX IF NOT EXISTS idx_cr2_ip    ON call_requests (ip_hash, created_at);
