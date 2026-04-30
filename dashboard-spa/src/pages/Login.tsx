import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, signup } from "../lib/api";
import { useAuth } from "../lib/auth-context";

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const fn = mode === "login" ? login : signup;
      const { token, user } = await fn(email, password);
      setAuth(token, user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <div className="card" style={{ width: 380 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
          RAG評価ダッシュボード
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            marginBottom: 28,
          }}
        >
          {mode === "login" ? "ログイン" : "アカウント作成"}
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                width: "100%",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "9px 12px",
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "signup" ? 8 : 1}
              style={{
                width: "100%",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "9px 12px",
                fontSize: 14,
              }}
            />
            {mode === "signup" && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                8文字以上
              </p>
            )}
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--red)" }}>{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading
              ? "処理中..."
              : mode === "login"
                ? "ログイン"
                : "アカウント作成"}
          </button>
        </form>

        <p
          style={{
            marginTop: 20,
            fontSize: 13,
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          {mode === "login" ? (
            <>
              アカウントをお持ちでない方は{" "}
              <button
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                style={{
                  background: "none",
                  color: "var(--primary)",
                  padding: 0,
                  fontSize: 13,
                }}
              >
                新規登録
              </button>
            </>
          ) : (
            <>
              すでにアカウントをお持ちの方は{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                style={{
                  background: "none",
                  color: "var(--primary)",
                  padding: 0,
                  fontSize: 13,
                }}
              >
                ログイン
              </button>
            </>
          )}
        </p>

        <p
          style={{
            marginTop: 16,
            fontSize: 12,
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          アカウント作成により{" "}
          <Link
            to="/privacy"
            style={{ color: "var(--text-muted)", textDecoration: "underline" }}
          >
            プライバシーポリシー
          </Link>{" "}
          に同意したものとみなします。
        </p>
      </div>
    </div>
  );
}
