# 02 — Environment Variables

Copy `.env.example` to `.env` and fill in all required values. Never commit `.env`.

## Full variable reference

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string | [Neon](https://neon.tech) / [Supabase](https://supabase.com) / local Postgres |
| `FIREBASE_PROJECT_ID` | yes | Firebase project ID | Firebase Console → Project Settings |
| `FIREBASE_CLIENT_EMAIL` | yes | Firebase service account email | Firebase Console → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | yes | Firebase service account private key | Firebase Console → Service Accounts |
| `API_JWT_SECRET` | yes | 64-char hex secret for signing API access tokens | `openssl rand -hex 32` |
| `OPENAI_API_KEY` | yes | OpenAI API key | [platform.openai.com](https://platform.openai.com) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | yes | Google OAuth web client ID | Google Cloud Console → Credentials |
| `EXPO_PUBLIC_API_URL` | yes | Base URL for the Hono API | e.g. `https://your-app.vercel.app/api` |
| `REVENUECAT_WEBHOOK_SECRET` | no | RevenueCat server-to-server notification secret | RevenueCat dashboard → Integrations |

## Generating `API_JWT_SECRET`

```bash
openssl rand -hex 32
```

## Vercel dashboard

Set all variables (except `EXPO_PUBLIC_*`) in the Vercel project dashboard under Settings → Environment Variables. The `EXPO_PUBLIC_*` variables are baked into the Expo bundle at build time and are not server secrets.
