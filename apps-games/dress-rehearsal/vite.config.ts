import { defineConfig } from "vite";

export default defineConfig({
  server: { host: true, port: 4015, strictPort: true },
  preview: { port: 4015, strictPort: true },
  build: { outDir: "dist", target: "es2022" },
});
