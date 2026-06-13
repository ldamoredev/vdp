import * as path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The SPA always talks to the API same-origin (/api/...). In dev that origin is
// the Vite server, which proxies to the Fastify backend; in production Fastify
// itself serves this build (see server/src/App.ts registerSpaStatic).
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: false,
      },
    },
  },
});
