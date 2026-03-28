-- api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  key_hash   TEXT UNIQUE NOT NULL,
  name       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- evaluations
CREATE TABLE IF NOT EXISTS evaluations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id              UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  question                TEXT NOT NULL,
  answer                  TEXT NOT NULL,
  chunks                  JSONB DEFAULT '[]',
  latency_ms              INTEGER,
  auto_score_relevance    FLOAT,
  auto_score_faithfulness FLOAT,
  auto_score_completeness FLOAT,
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_api_key_id ON evaluations(api_key_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at DESC);

-- feedbacks
CREATE TABLE IF NOT EXISTS feedbacks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
  rating        INTEGER CHECK (rating IN (1, -1)),
  comment       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_evaluation_id ON feedbacks(evaluation_id);
