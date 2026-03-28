import type { Stats } from "@/lib/types";

function pct(v: number | null) {
  if (v === null) return "—";
  return (v * 100).toFixed(1) + "%";
}

function score(v: number | null) {
  if (v === null) return "—";
  return v.toFixed(2);
}

function badgeClass(v: number | null): string {
  if (v === null) return "badge badge-gray";
  if (v >= 0.8) return "badge badge-green";
  if (v >= 0.5) return "badge badge-amber";
  return "badge badge-red";
}

type Props = { stats: Stats };

export function StatsCards({ stats }: Props) {
  const cards = [
    { label: "総クエリ数", value: stats.total.toLocaleString(), badge: null },
    {
      label: "平均 Relevance",
      value: score(stats.avg_relevance),
      badge: stats.avg_relevance,
    },
    {
      label: "平均 Faithfulness",
      value: score(stats.avg_faithfulness),
      badge: stats.avg_faithfulness,
    },
    {
      label: "平均 Completeness",
      value: score(stats.avg_completeness),
      badge: stats.avg_completeness,
    },
    {
      label: "フィードバック良い率",
      value: pct(stats.positive_feedback_rate),
      badge: stats.positive_feedback_rate,
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 16,
      }}
    >
      {cards.map((c) => (
        <div key={c.label} className="card">
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
            {c.label}
          </p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{c.value}</p>
          {c.badge !== null && (
            <span className={badgeClass(c.badge)} style={{ marginTop: 8 }}>
              {c.badge !== null && c.badge >= 0.8
                ? "良好"
                : c.badge !== null && c.badge >= 0.5
                ? "要改善"
                : "低い"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
