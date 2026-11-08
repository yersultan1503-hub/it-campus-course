import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {fileURLToPath} from "node:url";

export default defineConfig({
  base: "/game/",
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: {campus:fileURLToPath(new URL("index.html",import.meta.url)),legacyAccess:fileURLToPath(new URL("src/legacyAccessEntry.js",import.meta.url))},
      output: {entryFileNames: chunk=>chunk.name==="legacyAccess"?"legacy-access.js":"assets/[name]-[hash].js"},
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react()],
});
