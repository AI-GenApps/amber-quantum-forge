import { defineConfig } from "vite";

export default defineConfig({
  server: { host: true, port: 4010, strictPort: true },
  preview: { port: 4010, strictPort: true },
  build: {
    outDir: "dist",
    target: "es2022",
    // Rapier inlines its ~4 MB wasm as base64; its own chunk keeps the app JS budget measurable.
    chunkSizeWarningLimit: 6000,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: "rapier", test: /rapier3d-compat/ }],
        },
      },
    },
  },
});
