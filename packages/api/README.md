# @repo/api

[Hono](https://hono.dev/) API. Routes are defined in `src/routes/`.

This package is not deployed standalone. It is consumed by `apps/web` and mounted at `/api/*` via a Next.js catch-all route handler (`apps/web/app/api/[...route]/route.ts`), so it ships as part of the web app's Vercel deployment.

## Auth

Firebase tokens are validated server-side via `firebase-admin`.
