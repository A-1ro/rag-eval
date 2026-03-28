"use client";

import { useState, useEffect } from "react";
import { createApiKey, listApiKeys, deleteApiKey } from "@/lib/api";
import type { CreateKeyResponse, ApiKeyInfo } from "@/lib/types";

export function ApiKeyManager() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<CreateKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);

  useEffect(() => {
    listApiKeys().then(setKeys).catch(() => {});
  }, []);

  async function handleCreate() {
    setLoading(true);
    try {
      const result = await createApiKey(name || undefined);
      setCreated(result);
      setName("");
      setKeys((prev) => [
        { id: result.id, name: result.name, created_at: new Date().toISOString() },
        ...prev,
      ]);
    } catch {
      alert("APIキーの作成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(keyId: string) {
    if (!confirm("このAPIキーを削除しますか？削除すると復元できません。")) return;
    try {
      await deleteApiKey(keyId);
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch {
      alert("削除に失敗しました");
    }
  }

  async function copyKey() {
    if (!created) return;
    await navigator.clipboard.writeText(created.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 発行フォーム */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          新しいAPIキーを発行
        </h2>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              名前（任意）
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 本番環境"
              style={{
                width: "100%",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "8px 12px",
                fontSize: 14,
              }}
            />
          </div>
          <button className="btn-primary" onClick={handleCreate} disabled={loading}>
            {loading ? "発行中..." : "発行"}
          </button>
        </div>
      </div>

      {/* 発行直後の表示（1度のみ） */}
      {created && (
        <div
          className="card"
          style={{ border: "1px solid var(--green)", background: "#f0fdf4" }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#065f46", marginBottom: 8 }}>
            APIキーが発行されました
          </h3>
          <p style={{ fontSize: 12, color: "#065f46", marginBottom: 12 }}>
            このキーは今後表示されません。安全な場所に保管してください。
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "8px 12px",
            }}
          >
            <code style={{ flex: 1, fontSize: 13, wordBreak: "break-all" }}>
              {created.key}
            </code>
            <button className="btn-ghost" onClick={copyKey}>
              {copied ? "コピー済み" : "コピー"}
            </button>
          </div>
        </div>
      )}

      {/* 発行済みキー一覧 */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          発行済みAPIキー
        </h2>
        {keys.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            まだAPIキーがありません
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {keys.map((k, i) => (
              <div
                key={k.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderTop: i > 0 ? "1px solid var(--border)" : "none",
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>
                    {k.name || "（名前なし）"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    ID: {k.id.slice(0, 12)}... ·{" "}
                    {new Date(k.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
                <button
                  className="btn-danger"
                  onClick={() => handleDelete(k.id)}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 使い方 */}
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
          使い方
        </h2>
        <pre
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 16,
            fontSize: 13,
            overflowX: "auto",
          }}
        >
          {`pip install rag-eval

from rag_eval import track

track(
    question="...",
    answer="...",
    chunks=[{"content": "..."}],
    api_key="rag_eval_xxxx",
)`}
        </pre>
      </div>
    </div>
  );
}
