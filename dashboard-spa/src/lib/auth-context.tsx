import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { clearToken, fetchMe, getToken, setToken } from "./api";
import type { AuthUser } from "./types";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated"; user: null };

type AuthContextValue = AuthState & {
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    if (!getToken()) {
      setState({ status: "unauthenticated", user: null });
      return;
    }
    fetchMe()
      .then(({ user }) => setState({ status: "authenticated", user }))
      .catch(() => {
        clearToken();
        setState({ status: "unauthenticated", user: null });
      });
  }, []);

  const setAuth = useCallback((token: string, user: AuthUser) => {
    setToken(token);
    setState({ status: "authenticated", user });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ status: "unauthenticated", user: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
