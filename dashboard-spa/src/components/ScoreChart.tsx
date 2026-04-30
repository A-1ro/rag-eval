import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Evaluation } from "../lib/types";

type ChartPoint = {
  date: string;
  relevance: number | null;
  faithfulness: number | null;
  completeness: number | null;
};

function toChartData(evaluations: Evaluation[]): ChartPoint[] {
  return [...evaluations]
    .reverse()
    .map((e) => ({
      date: new Date(e.created_at).toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
      }),
      relevance: e.auto_score_relevance,
      faithfulness: e.auto_score_faithfulness,
      completeness: e.auto_score_completeness,
    }))
    .filter(
      (p) =>
        p.relevance !== null ||
        p.faithfulness !== null ||
        p.completeness !== null,
    );
}

type Props = { evaluations: Evaluation[] };

export function ScoreChart({ evaluations }: Props) {
  const data = toChartData(evaluations);

  if (data.length === 0) {
    return (
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 200,
          color: "var(--text-muted)",
        }}
      >
        スコアデータがありません
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        スコア推移
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(v: number) => v.toFixed(2)}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="relevance"
            name="Relevance"
            stroke="#6366f1"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="faithfulness"
            name="Faithfulness"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="completeness"
            name="Completeness"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
