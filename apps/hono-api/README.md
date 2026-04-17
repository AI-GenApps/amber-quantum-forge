# Hono API

[Hono](https://hono.dev/) API server designed to run on Vercel. Routes are defined in `src/routes/`.

The API app is exported from `@repo/api` and mounted in the [web app](../web/README.md) at `/api/*` via a Next.js catch-all route handler.

## Development

```bash
bun run dev      # standalone dev server
bun run build
```

## Auth

Firebase tokens are validated server-side via `firebase-admin`. See the web app's `/api/*` routes for the full integration.
