import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 開発時は同居Workerを別ポートで動かして、/api/* をプロキシする想定。
// 本番はSPAとAPIが同一Worker (同一オリジン) なのでプロキシ不要。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
