-- users (custom auth)
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash   TEXT UNIQUE NOT NULL,
  name       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id                      TEXT PRIMARY KEY,
  api_key_id              TEXT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  question                TEXT NOT NULL,
  answer                  TEXT NOT NULL,
  chunks                  TEXT NOT NULL DEFAULT '[]', -- JSON array
  latency_ms              INTEGER,
  auto_score_relevance    REAL,
  auto_score_faithfulness REAL,
  auto_score_completeness REAL,
  created_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evaluations_api_key_id ON evaluations(api_key_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);

-- feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id            TEXT PRIMARY KEY,
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  rating        INTEGER NOT NULL CHECK (rating IN (1, -1)),
  comment       TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_evaluation_id ON feedbacks(evaluation_id);
