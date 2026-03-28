"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { EvaluationTable } from "@/components/EvaluationTable";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { fetchStats } from "@/lib/api";
import type { Evaluation } from "@/lib/types";

function EvaluationsContent({ apiKey }: { apiKey: string }) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    fetchStats(apiKey, page * limit, limit)
      .then((s) => {
        setEvaluations(s.recent);
        setTotal(s.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [apiKey, page]);

  return (
    <>
      <Nav />
      <main className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
              Evaluations
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              全{total.toLocaleString()}件
            </p>
          </div>
        </div>

        {loading && <p style={{ color: "var(--text-muted)" }}>読み込み中...</p>}
        {error && <p style={{ color: "var(--red)" }}>エラー: {error}</p>}
        {!loading && <EvaluationTable evaluations={evaluations} />}

        {total > limit && (
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <button
              className="btn-ghost"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              前へ
            </button>
            <span
              style={{
                padding: "8px 16px",
                fontSize: 14,
                color: "var(--text-muted)",
              }}
            >
              {page + 1} / {Math.ceil(total / limit)}
            </span>
            <button
              className="btn-ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * limit >= total || loading}
            >
              次へ
            </button>
          </div>
        )}
      </main>
    </>
  );
}

export default function EvaluationsPage() {
  return (
    <ApiKeyGate>
      {(apiKey) => <EvaluationsContent apiKey={apiKey} />}
    </ApiKeyGate>
  );
}
