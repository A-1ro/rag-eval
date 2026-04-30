import { useState } from "react";
import { submitFeedback } from "../lib/api";

type Props = {
  evaluationId: string;
};

export function FeedbackButton({ evaluationId }: Props) {
  const [sent, setSent] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingRating, setPendingRating] = useState<1 | -1 | null>(null);

  function handleRatingClick(rating: 1 | -1) {
    if (sent !== null || loading) return;
    setPendingRating(rating);
  }

  async function handleSubmit() {
    if (pendingRating === null || loading) return;
    setLoading(true);
    try {
      await submitFeedback(evaluationId, pendingRating, comment || undefined);
      setSent(pendingRating);
    } catch {
      alert("フィードバックの送信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (sent !== null) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        <span>{sent === 1 ? "👍" : "👎"}</span>
        <span>フィードバックありがとうございます</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {([1, -1] as const).map((r) => (
          <button
            key={r}
            className="btn-ghost"
            onClick={() => handleRatingClick(r)}
            disabled={loading}
            style={{
              fontSize: 18,
              padding: "8px 20px",
              outline:
                pendingRating === r ? "2px solid var(--primary)" : undefined,
            }}
            title={r === 1 ? "良い回答" : "悪い回答"}
          >
            {r === 1 ? "👍" : "👎"}
          </button>
        ))}
      </div>

      {pendingRating !== null && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="コメント（任意）"
            rows={3}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 10,
              fontSize: 14,
              resize: "vertical",
            }}
          />
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ alignSelf: "flex-start" }}
          >
            {loading ? "送信中..." : "フィードバックを送信"}
          </button>
        </div>
      )}
    </div>
  );
}
