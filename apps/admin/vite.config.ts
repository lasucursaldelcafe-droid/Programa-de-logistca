import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: process.env.NATIVE_BUILD === "true" ? "./" : (process.env.GITHUB_PAGES_BASE ?? "/"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@core": path.resolve(__dirname, "./src"),
      "@master": path.resolve(__dirname, "../master/src"),
      "@worker": path.resolve(__dirname, "../worker/src"),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  define: {
    "import.meta.env.DEV": JSON.stringify(process.env.NODE_ENV !== "production"),
  },
});
