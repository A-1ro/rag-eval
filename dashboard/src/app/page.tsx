"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { StatsCards } from "@/components/StatsCards";
import { ScoreChart } from "@/components/ScoreChart";
import { EvaluationTable } from "@/components/EvaluationTable";
import { ApiKeyGate } from "@/components/ApiKeyGate";
import { fetchStats } from "@/lib/api";
import type { Stats } from "@/lib/types";

function OverviewContent({ apiKey }: { apiKey: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats(apiKey)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [apiKey]);

  return (
    <>
      <Nav />
      <main className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Overview
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            RAGシステムの品質サマリー
          </p>
        </div>

        {loading && (
          <p style={{ color: "var(--text-muted)" }}>読み込み中...</p>
        )}
        {error && <p style={{ color: "var(--red)" }}>エラー: {error}</p>}

        {stats && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <StatsCards stats={stats} />
            <ScoreChart evaluations={stats.recent} />
            <div>
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                最近の評価
              </h2>
              <EvaluationTable evaluations={stats.recent} />
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default function Home() {
  return (
    <ApiKeyGate>
      {(apiKey) => <OverviewContent apiKey={apiKey} />}
    </ApiKeyGate>
  );
}
