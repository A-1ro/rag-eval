import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { listApiKeys } from "./api";
import type { ApiKeyInfo } from "./types";

const STORAGE_KEY = "rag_eval_selected_key_id";

type EnvContextValue = {
  keys: ApiKeyInfo[];
  selectedKeyId: string;
  loading: boolean;
  setSelectedKeyId: (id: string) => void;
  refresh: () => Promise<void>;
};

const EnvContext = createContext<EnvContextValue | null>(null);

export function EnvProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [selectedKeyId, setSelectedKeyIdState] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await listApiKeys();
      setKeys(data);
      const saved = localStorage.getItem(STORAGE_KEY);
      const validSaved = data.find((k) => k.id === saved);
      const initial = validSaved ? saved! : (data[0]?.id ?? "");
      setSelectedKeyIdState(initial);
      if (initial) localStorage.setItem(STORAGE_KEY, initial);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const setSelectedKeyId = useCallback((id: string) => {
    setSelectedKeyIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <EnvContext.Provider
      value={{ keys, selectedKeyId, loading, setSelectedKeyId, refresh }}
    >
      {children}
    </EnvContext.Provider>
  );
}

export function useEnv(): EnvContextValue {
  const ctx = useContext(EnvContext);
  if (!ctx) throw new Error("useEnv must be used inside EnvProvider");
  return ctx;
}
