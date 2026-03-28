"use client";

import { useState, useEffect } from "react";
import { listApiKeys } from "@/lib/api";
import type { ApiKeyInfo } from "@/lib/types";

const STORAGE_KEY = "rag_eval_selected_key";

type Props = { children: (apiKey: string) => React.ReactNode };

/**
 * ログイン済みユーザーが持つAPIキーを一覧表示し、
 * どのキーのデータを表示するか選択させるゲートコンポーネント。
 */
export function ApiKeyGate({ children }: Props) {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [selectedApiKey, setSelectedApiKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) ?? "";
    setSelectedApiKey(saved);

    listApiKeys()
      .then((data) => {
        setKeys(data);
        if (data.length > 0 && !saved) {
          // 保存済みキーがなければ最初のキーを選択（IDのみ記録）
          setSelectedKeyId(data[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!mounted || loading) return null;

  // SDKキー（rag_eval_xxxx）を入力させる画面
  if (!selectedApiKey) {
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
        <div className="card" style={{ width: 420 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
            表示するAPIキーを入力
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
            Settings画面で発行した <code>rag_eval_xxxx</code> 形式のキーを入力してください。
          </p>

          {keys.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                }}
              >
                発行済みキーから選択
              </label>
              <select
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "9px 12px",
                  fontSize: 14,
                }}
              >
                <option value="">選択してください</option>
                {keys.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name || k.id.slice(0, 8) + "..."}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                ※ セキュリティのため平文キーは再表示できません。下のフォームに直接入力してください。
              </p>
            </div>
          )}

          <ApiKeyInput onSubmit={(key) => {
            localStorage.setItem(STORAGE_KEY, key);
            setSelectedApiKey(key);
          }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {children(selectedApiKey)}
      <button
        className="btn-ghost"
        onClick={() => {
          localStorage.removeItem(STORAGE_KEY);
          setSelectedApiKey("");
        }}
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          fontSize: 12,
        }}
      >
        キーを変更
      </button>
    </div>
  );
}

function ApiKeyInput({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-muted)",
        }}
      >
        APIキーを直接入力
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="rag_eval_xxxx"
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onSubmit(value.trim());
        }}
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "9px 12px",
          fontSize: 14,
        }}
        autoFocus
      />
      <button
        className="btn-primary"
        onClick={() => { if (value.trim()) onSubmit(value.trim()); }}
        disabled={!value.trim()}
      >
        表示する
      </button>
    </div>
  );
}
