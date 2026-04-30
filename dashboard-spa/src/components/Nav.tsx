import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { EnvSelector } from "./EnvSelector";

export function Nav() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
      }}
    >
      <div
        className="container nav-inner"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          height: 56,
        }}
      >
        <Link
          to="/"
          style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}
        >
          RAG Eval
        </Link>

        <div
          className="nav-links"
          style={{ display: "flex", alignItems: "center", gap: 24 }}
        >
          <Link to="/" style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Overview
          </Link>
          <Link
            to="/evaluations"
            style={{ fontSize: 14, color: "var(--text-muted)" }}
          >
            Evaluations
          </Link>
          <Link
            to="/settings"
            style={{ fontSize: 14, color: "var(--text-muted)" }}
          >
            Settings
          </Link>
        </div>

        <div
          className="nav-right"
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <EnvSelector />
          <button
            className="btn-ghost"
            onClick={handleLogout}
            style={{ fontSize: 13 }}
          >
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  );
}
