import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 4010, strictPort: true },
  preview: { port: 4010, strictPort: true },
  build: { outDir: "dist", target: "es2022" },
});
