"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { FeedbackButton } from "@/components/FeedbackButton";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { fetchStats } from "@/lib/api";
import type { Evaluation } from "@/lib/types";

function ScoreRow({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const pct = value !== null ? Math.round(value * 100) : null;
  const color =
    value === null
      ? "var(--border)"
      : value >= 0.8
      ? "var(--green)"
      : value >= 0.5
      ? "var(--amber)"
      : "var(--red)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>
          {pct !== null ? `${pct}%` : "採点中"}
        </span>
      </div>
      <div
        style={{
          height: 8,
          background: "var(--border)",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        {pct !== null && (
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: color,
              borderRadius: 99,
            }}
          />
        )}
      </div>
    </div>
  );
}

function DetailContent({
  apiKey,
  id,
}: {
  apiKey: string;
  id: string;
}) {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // statsエンドポイントから該当IDを探す（MVP: 専用エンドポイント未実装）
    fetchStats(apiKey, 0, 100)
      .then((s) => {
        const found = s.recent.find((e) => e.id === id);
        if (!found) setError("評価が見つかりません");
        else setEvaluation(found);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [apiKey, id]);

  return (
    <>
      <Nav />
      <main className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <Link
          href="/evaluations"
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            display: "inline-block",
            marginBottom: 20,
          }}
        >
          ← Evaluations一覧に戻る
        </Link>

        {loading && <p style={{ color: "var(--text-muted)" }}>読み込み中...</p>}
        {error && <p style={{ color: "var(--red)" }}>エラー: {error}</p>}

        {evaluation && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                質問
              </h2>
              <p>{evaluation.question}</p>
            </div>

            <div className="card">
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                }}
              >
                回答
              </h2>
              <p style={{ lineHeight: 1.7 }}>{evaluation.answer}</p>
            </div>

            {evaluation.chunks.length > 0 && (
              <div className="card">
                <h2
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    marginBottom: 12,
                  }}
                >
                  参照チャンク（{evaluation.chunks.length}件）
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {evaluation.chunks.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius)",
                        padding: 12,
                      }}
                    >
                      {c.source && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--text-muted)",
                            marginBottom: 4,
                          }}
                        >
                          {c.source}
                        </p>
                      )}
                      <p style={{ fontSize: 13, lineHeight: 1.6 }}>
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 16,
                }}
              >
                自動評価スコア
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <ScoreRow
                  label="Relevance（関連性）"
                  value={evaluation.auto_score_relevance}
                />
                <ScoreRow
                  label="Faithfulness（忠実性）"
                  value={evaluation.auto_score_faithfulness}
                />
                <ScoreRow
                  label="Completeness（完全性）"
                  value={evaluation.auto_score_completeness}
                />
              </div>
              {evaluation.latency_ms !== null && (
                <p
                  style={{
                    marginTop: 16,
                    fontSize: 13,
                    color: "var(--text-muted)",
                  }}
                >
                  レイテンシ: {evaluation.latency_ms}ms
                </p>
              )}
            </div>

            <div className="card">
              <h2
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  marginBottom: 12,
                }}
              >
                この回答はいかがでしたか？
              </h2>
              <FeedbackButton
                evaluationId={evaluation.id}
                apiKey={apiKey}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function EvaluationDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  return (
    <ApiKeyGate>
      {(apiKey) => <DetailContent apiKey={apiKey} id={id} />}
    </ApiKeyGate>
  );
}
