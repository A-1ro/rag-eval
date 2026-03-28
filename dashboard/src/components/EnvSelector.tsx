"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { listApiKeys } from "@/lib/api";
import type { ApiKeyInfo } from "@/lib/types";

const STORAGE_KEY = "rag_eval_selected_key_id";

type EnvContextType = {
  selectedKeyId: string;
  keys: ApiKeyInfo[];
  setSelectedKeyId: (id: string) => void;
};

const EnvContext = createContext<EnvContextType>({
  selectedKeyId: "",
  keys: [],
  setSelectedKeyId: () => {},
});

export function useEnv() {
  return useContext(EnvContext);
}

export function EnvProvider({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [selectedKeyId, setSelectedKeyIdState] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    listApiKeys()
      .then((data) => {
        setKeys(data);
        const saved = localStorage.getItem(STORAGE_KEY);
        const validSaved = data.find((k) => k.id === saved);
        const initial = validSaved ? saved! : data[0]?.id ?? "";
        setSelectedKeyIdState(initial);
        if (initial) localStorage.setItem(STORAGE_KEY, initial);
      })
      .catch(() => {});
  }, []);

  function setSelectedKeyId(id: string) {
    setSelectedKeyIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  if (!mounted) return null;

  return (
    <EnvContext.Provider value={{ selectedKeyId, keys, setSelectedKeyId }}>
      {children}
    </EnvContext.Provider>
  );
}

export function EnvSelector() {
  const { keys, selectedKeyId, setSelectedKeyId } = useEnv();

  if (keys.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
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
