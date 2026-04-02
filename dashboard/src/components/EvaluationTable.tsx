import Link from "next/link";
import type { Evaluation } from "@/lib/types";

function ScoreBadge({ value }: { value: number | null }) {
  if (value === null)
    return <span className="badge badge-gray">採点中</span>;
  const cls =
    value >= 0.8
      ? "badge badge-green"
      : value >= 0.5
      ? "badge badge-amber"
      : "badge badge-red";
  return <span className={cls}>{value.toFixed(2)}</span>;
}

type Props = { evaluations: Evaluation[] };

export function EvaluationTable({ evaluations }: Props) {
  if (evaluations.length === 0) {
    return (
      <div
        className="card"
        style={{
          textAlign: "center",
          padding: 48,
          color: "var(--text-muted)",
        }}
      >
        評価データがありません。SDKでデータを送信してください。
      </div>
    );
  }

  return (
    <div className="card table-scroll" style={{ padding: 0, overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
        <thead>
          <tr style={{ background: "var(--bg)" }}>
            {[
              "質問",
              "Relevance",
              "Faithfulness",
              "Completeness",
              "レイテンシ",
              "日時",
              "",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "10px 16px",
                  textAlign: "left",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  borderBottom: "1px solid var(--border)",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {evaluations.map((e, i) => (
            <tr
              key={e.id}
              style={{
                borderBottom:
                  i < evaluations.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <td
                style={{
                  padding: "12px 16px",
                  maxWidth: 280,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 14,
                }}
              >
                {e.question}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <ScoreBadge value={e.auto_score_relevance} />
              </td>
              <td style={{ padding: "12px 16px" }}>
                <ScoreBadge value={e.auto_score_faithfulness} />
              </td>
              <td style={{ padding: "12px 16px" }}>
                <ScoreBadge value={e.auto_score_completeness} />
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {e.latency_ms !== null ? `${e.latency_ms}ms` : "—"}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  fontSize: 13,
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {new Date(e.created_at).toLocaleString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td style={{ padding: "12px 16px" }}>
                <Link
                  href={`/evaluations/${e.id}`}
                  style={{ fontSize: 13, color: "var(--primary)" }}
                >
                  詳細
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
