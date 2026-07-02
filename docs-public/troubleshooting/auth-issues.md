---
title: Auth Issues
---

# Auth Issues

If sign-in appears stuck or users are bounced out, follow this order:

1. Confirm Firebase keys are valid in `.env`.
2. Confirm the web app URL in platform settings matches your local/public domain.
3. Confirm `POST /api/auth/exchange` returns a token pair and no 401.
4. Confirm `EXPO_PUBLIC_API_URL` points to `/api` for mobile clients.

### Common symptoms

- **No token returned**: usually invalid Firebase ID token or missing `API_JWT_SECRET`.
- **401 from protected route**: token missing in `Authorization` header or expired/invalid token.
- **Immediate logout after app restart**: refresh token not persisted in secure storage.
