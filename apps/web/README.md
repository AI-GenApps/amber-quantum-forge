# Web (Next.js)

[Next.js](https://nextjs.org/) 16 app with Tailwind CSS and [shadcn/ui](https://ui.shadcn.com/). Hosts the [Hono API](../hono-api/README.md) via catch-all route at `app/api/[[..route]]/route.ts`.

## Development

```bash
bun run dev      # http://localhost:4001
bun run build
bun run lint
```

## Deploy

Deployed to [Vercel](https://vercel.com/docs/deployments/overview). The Hono API is served from `/api/*` automatically.
