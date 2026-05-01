# Web (Next.js)

[Next.js](https://nextjs.org/) 16 app with Tailwind CSS and [shadcn/ui](https://ui.shadcn.com/). Hosts the [Hono API](../../packages/api/README.md) at `app/api/[...route]/route.ts` and exposes an admin panel at `/admin`.

## Development

```bash
bun run dev      # http://localhost:4001
bun run build
```

## Admin panel

`/admin` is gated by `proxy.ts` (Next.js 16 middleware). Sign in flow:

1. `/admin/sign-in` → Firebase Google popup → `POST /api/admin/session`
2. The route verifies the ID token, checks the `admin: true` Firebase custom claim **or** the `ADMIN_UIDS` allowlist, and sets a signed `admin_session` httpOnly cookie.
3. `proxy.ts` redirects unauthenticated requests under `/admin/**` to sign-in.

To bootstrap the first admin: add their Firebase UID to `ADMIN_UIDS`, sign in once, then promote them with `bun --cwd packages/api run grant-admin <uid>` (sign out and back in for the claim to apply). After that the allowlist can be cleared.

Sections:

- `/admin/metadata` — version gate, feature flags, maintenance mode, store URLs, support/legal URLs (consumed by the native app via `GET /api/config/app-metadata`).
- `/admin/users` — Firebase-linked users + their registered devices, with revoke/disable/delete.

## Environment

Required env vars are listed in the root [`.env.example`](../../.env.example). The web app needs (at minimum): `DATABASE_URL`, `FIREBASE_*` (admin SDK), `NEXT_PUBLIC_FIREBASE_*` (web SDK), `ADMIN_SESSION_SECRET`, `ADMIN_UIDS`, and `BLOB_READ_WRITE_TOKEN`.

## Deploy

Deployed to [Vercel](https://vercel.com/docs/deployments/overview). The Hono API ships as part of this app and is served from `/api/*`.
