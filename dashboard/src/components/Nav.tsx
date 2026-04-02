"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { EnvSelector } from "./EnvSelector";

export function Nav() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
          href="/"
          style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}
        >
          RAG Eval
        </Link>

        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Link href="/" style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Overview
          </Link>
          <Link href="/evaluations" style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Evaluations
          </Link>
          <Link href="/settings" style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Settings
          </Link>
        </div>

        <div className="nav-right" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <EnvSelector />
          <button className="btn-ghost" onClick={handleLogout} style={{ fontSize: 13 }}>
            ログアウト
          </button>
        </div>
      </div>
    </nav>
  );
}
