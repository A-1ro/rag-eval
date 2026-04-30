import { useEffect, useState } from "react";
import { Nav } from "../components/Nav";
import { EvaluationTable } from "../components/EvaluationTable";
import { fetchStats } from "../lib/api";
import { useEnv } from "../lib/env-context";
import type { Evaluation } from "../lib/types";

const LIMIT = 20;

export function EvaluationsPage() {
  const { selectedKeyId } = useEnv();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [selectedKeyId]);

  useEffect(() => {
    if (!selectedKeyId) return;
    setLoading(true);
    setError(null);
    fetchStats(selectedKeyId, page * LIMIT, LIMIT)
      .then((s) => {
        setEvaluations(s.recent);
        setTotal(s.total);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedKeyId, page]);

  return (
    <>
      <Nav />
      <main className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Evaluations
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            全{total.toLocaleString()}件
          </p>
        </div>

        {loading && (
          <p style={{ color: "var(--text-muted)" }}>読み込み中...</p>
        )}
        {error && <p style={{ color: "var(--red)" }}>エラー: {error}</p>}
        {!loading && <EvaluationTable evaluations={evaluations} />}

        {total > LIMIT && (
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
              {page + 1} / {Math.ceil(total / LIMIT)}
            </span>
            <button
              className="btn-ghost"
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * LIMIT >= total || loading}
            >
              次へ
            </button>
          </div>
        )}
      </main>
    </>
  );
}
