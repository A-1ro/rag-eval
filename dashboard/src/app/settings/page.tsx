"use client";

import { Nav } from "@/components/Nav";
import { ApiKeyManager } from "@/components/ApiKeyManager";
import { EnvProvider } from "@/components/EnvSelector";

export default function SettingsPage() {
  return (
    <EnvProvider>
      <Nav />
      <main className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>APIキー管理・接続設定</p>
        </div>
        <ApiKeyManager />
      </main>
    </EnvProvider>
  );
}
