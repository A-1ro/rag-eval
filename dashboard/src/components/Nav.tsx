"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

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
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          height: 56,
        }}
      >
        <Link
          href="/"
          style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}
        >
          RAG Eval
        </Link>
        <Link href="/" style={{ fontSize: 14, color: "var(--text-muted)" }}>
          Overview
        </Link>
        <Link
          href="/evaluations"
          style={{ fontSize: 14, color: "var(--text-muted)" }}
        >
          Evaluations
        </Link>
        <Link
          href="/settings"
          style={{ fontSize: 14, color: "var(--text-muted)" }}
        >
          Settings
        </Link>
        <div style={{ marginLeft: "auto" }}>
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
