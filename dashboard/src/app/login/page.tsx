"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
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
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 28 }}>
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
              minLength={6}
              style={{
                width: "100%",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "9px 12px",
                fontSize: 14,
              }}
            />
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

        <p style={{ marginTop: 20, fontSize: 13, textAlign: "center", color: "var(--text-muted)" }}>
          {mode === "login" ? (
            <>
              アカウントをお持ちでない方は{" "}
              <button
                onClick={() => { setMode("signup"); setError(null); }}
                style={{ background: "none", color: "var(--primary)", padding: 0, fontSize: 13 }}
              >
                新規登録
              </button>
            </>
          ) : (
            <>
              すでにアカウントをお持ちの方は{" "}
              <button
                onClick={() => { setMode("login"); setError(null); }}
                style={{ background: "none", color: "var(--primary)", padding: 0, fontSize: 13 }}
              >
                ログイン
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
