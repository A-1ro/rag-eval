"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "rag_eval_api_key";

type Props = { children: (apiKey: string) => React.ReactNode };

export function ApiKeyGate({ children }: Props) {
  const [apiKey, setApiKey] = useState<string>("");
  const [input, setInput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? "";
    setApiKey(saved);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!apiKey) {
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
        <div className="card" style={{ width: 400 }}>
          <h1
            style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}
          >
            RAG評価ダッシュボード
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              marginBottom: 24,
            }}
          >
            APIキーを入力してください
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="rag_eval_xxxx"
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim()) {
                  localStorage.setItem(STORAGE_KEY, input.trim());
                  setApiKey(input.trim());
                }
              }}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "10px 12px",
                fontSize: 14,
                width: "100%",
              }}
              autoFocus
            />
            <button
              className="btn-primary"
              onClick={() => {
                if (!input.trim()) return;
                localStorage.setItem(STORAGE_KEY, input.trim());
                setApiKey(input.trim());
              }}
              disabled={!input.trim()}
            >
              ログイン
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {children(apiKey)}
      <button
        className="btn-ghost"
        onClick={() => {
          localStorage.removeItem(STORAGE_KEY);
          setApiKey("");
        }}
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          fontSize: 12,
        }}
      >
        ログアウト
      </button>
    </div>
  );
}
