export type Bindings = {
  DB: D1Database;
  AI: Ai;
  ASSETS: Fetcher;
  JWT_SECRET: string;
};

export type ApiKeyInfo = {
  id: string;
  user_id: string;
  name: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
};

export type AppVariables = {
  apiKeyInfo: ApiKeyInfo;
  user: AuthUser;
};
