"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { StatsCards } from "@/components/StatsCards";
import { ScoreChart } from "@/components/ScoreChart";
import { EvaluationTable } from "@/components/EvaluationTable";
import { EnvProvider, useEnv } from "@/components/EnvSelector";
import { fetchStats } from "@/lib/api";
import type { Stats } from "@/lib/types";

function OverviewContent() {
  const { selectedKeyId } = useEnv();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedKeyId) return;
    setLoading(true);
    setStats(null);
    fetchStats(selectedKeyId)
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedKeyId]);

  return (
    <main className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Overview</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          RAGシステムの品質サマリー
        </p>
      </div>

      {!selectedKeyId && (
        <div className="card" style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Settings画面でAPIキーを発行してください。
        </div>
      )}
      {loading && <p style={{ color: "var(--text-muted)" }}>読み込み中...</p>}
      {error && <p style={{ color: "var(--red)" }}>エラー: {error}</p>}

      {stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <StatsCards stats={stats} />
          <ScoreChart evaluations={stats.recent} />
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              最近の評価
            </h2>
            <EvaluationTable evaluations={stats.recent} />
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <EnvProvider>
      <Nav />
      <OverviewContent />
    </EnvProvider>
  );
}
