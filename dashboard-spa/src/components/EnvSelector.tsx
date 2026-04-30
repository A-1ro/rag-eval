import { useEnv } from "../lib/env-context";

export function EnvSelector() {
  const { keys, selectedKeyId, setSelectedKeyId } = useEnv();

  if (keys.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
        }}
      >
        環境:
      </label>
      <select
        value={selectedKeyId}
        onChange={(e) => setSelectedKeyId(e.target.value)}
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "4px 8px",
          fontSize: 13,
          background: "var(--surface)",
          cursor: "pointer",
        }}
      >
        {keys.map((k) => (
          <option key={k.id} value={k.id}>
            {k.name || `キー (${k.id.slice(0, 8)}...)`}
          </option>
        ))}
      </select>
    </div>
  );
}
