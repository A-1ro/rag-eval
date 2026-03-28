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
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // セッションがnull = メール確認待ち
      if (!data.session) {
        setNeedsConfirmation(true);
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    }
  }

  if (needsConfirmation) {
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
        <div className="card" style={{ width: 380, textAlign: "center" }}>
          <p style={{ fontSize: 32, marginBottom: 16 }}>📧</p>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            確認メールを送信しました
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
            <strong>{email}</strong> に確認メールを送りました。
            メール内のリンクをクリックしてアカウントを有効化してください。
          </p>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16 }}>
            メールが届かない場合はSupabaseダッシュボードで
            「Confirm email」をOFFにするか、スパムフォルダを確認してください。
          </p>
          <button
            className="btn-ghost"
            onClick={() => { setNeedsConfirmation(false); setMode("login"); }}
            style={{ marginTop: 20 }}
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    );
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
