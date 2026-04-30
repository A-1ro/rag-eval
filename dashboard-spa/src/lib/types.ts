export type Chunk = {
  content: string;
  source?: string | null;
};

export type Evaluation = {
  id: string;
  question: string;
  answer: string;
  chunks: Chunk[];
  latency_ms: number | null;
  auto_score_relevance: number | null;
  auto_score_faithfulness: number | null;
  auto_score_completeness: number | null;
  created_at: string;
};

export type Stats = {
  total: number;
  avg_relevance: number | null;
  avg_faithfulness: number | null;
  avg_completeness: number | null;
  positive_feedback_rate: number | null;
  recent: Evaluation[];
};

export type ApiKeyInfo = {
  id: string;
  name: string | null;
  created_at: string;
};

export type CreateKeyResponse = {
  id: string;
  key: string;
  name: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
