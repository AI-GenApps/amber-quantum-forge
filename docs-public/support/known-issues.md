---
title: Known Issues
---

# Known Issues

## Current blockers

- Some Firebase environments reject local tokens when the clock skew is high.
- Streaming chat can show a short delay before first chunk on slower networks.
- OpenAPI docs currently represent the mobile-facing API contracts as implemented by
  `apps/web` routes.

If you hit a repeat issue, log the HTTP status, request payload, and timestamp
before requesting support.
