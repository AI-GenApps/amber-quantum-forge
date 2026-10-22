import { defineConfig } from "vite";

export default defineConfig({
  server: { host: true, port: 4012, strictPort: true },
  preview: { port: 4012, strictPort: true },
  build: { outDir: "dist", target: "es2022" },
});
