---
epic: 15-ludo-launch
task: 14-auth-refresh-fix
status: pending
commit_scope: auth
depends_on: [15-ludo-launch/13-human-local-checkpoint]
estimate: S
---

# Fix the API JWT refresh identity bug

## Goal

Fix `POST /api/auth/refresh` in `packages/api/src/routes/auth-tokens.ts`,
which currently signs the refreshed access token's `sub`/`uid` from the
user's **email** instead of their **Firebase UID**, before any Ludo identity
work (task 23) builds on top of the same token issuance path.

## Context/Decisions

- In `packages/api/src/routes/auth-tokens.ts`, `POST /exchange` correctly
  signs `sub: uid, uid: uid` (the Firebase UID) at lines ~79-86. `POST
  /refresh` instead signs `sub: userRecord.email, uid: userRecord.email` at
  lines ~148-155 — it looks up `users` by internal row, not `auth` (which
  holds `firebaseUid`), and uses the row's email as if it were the subject
  identifier. This means a refreshed access token carries a different `sub`
  than the token minted at exchange time for the same person, which breaks
  any downstream code that treats `sub`/`uid` as a stable Firebase UID
  (including the Ludo game-token exchange in task 23, which must map a
  verified API JWT subject to a stable player identity).
  - The route already loads `authRecord` via `eq(auth.userId, userRecord.id)`
    for the `provider` field (line ~145-147); `authRecord.firebaseUid` is
    already available on that same query result and must be used for
    `sub`/`uid` instead of `userRecord.email`.
- Preserve the response shape and rotation behavior (`refreshToken`,
  `expiresIn`, `tokenType`) exactly; only the claims signed into the new
  access token change.
- `users.email` can theoretically be empty string (see `/exchange`'s
  `email: email || ""` fallback); a `sub` derived from email would have been
  wrong for that case too. The `firebaseUid`-based fix removes this class of
  bug entirely and needs no special-casing.
- Add a regression test that: (1) exchanges a token, (2) refreshes it, and
  (3) asserts the refreshed access token's decoded `sub`/`uid` equals the
  original exchange's `sub`/`uid` (the Firebase UID), not the user's email.
  Check `packages/api/src/routes/*.test.ts` (if any exist) for the test
  harness pattern used elsewhere in this package (e.g. how `db` is faked or
  seeded in `packages/api/src/games/*.test.ts`) and reuse it rather than
  inventing a new one.

## Implementation Checklist

- [ ] In `authTokenRoutes.post("/refresh", ...)`, replace the `sub:
  userRecord.email, uid: userRecord.email` claims with `sub:
  authRecord.firebaseUid, uid: authRecord.firebaseUid`.
- [ ] Guard the case where `authRecord` is `null` (no linked Firebase auth
  row) — return `401` with a clear error rather than signing an
  `undefined`/`null` subject.
- [ ] Add `packages/api/src/routes/auth-tokens.test.ts` (or extend an
  existing test file if one already covers this route) with the
  exchange-then-refresh regression test described above, plus a case
  asserting `/refresh` fails closed when no linked `auth` row exists.
- [ ] Re-read `verifyApiToken`/`verifyAccessToken` consumers
  (`packages/api/src/lib/jwt.ts` and any route trusting `payload.sub` as a
  user-facing identity) to confirm nothing depended on the old
  email-as-subject behavior; note any such dependency in this task's PR
  description if found (do not silently change other routes).

## Files Touched

- `packages/api/src/routes/auth-tokens.ts`
- `packages/api/src/routes/auth-tokens.test.ts` (new or extended)

## Acceptance Criteria

- A token minted by `/exchange` and a token minted by `/refresh` for the same
  user decode to the same `sub` and `uid` (the Firebase UID), verified by an
  automated test.
- `/refresh` returns `401` (not a token with a broken identity) when the
  refresh token's user has no linked `auth` row.
- No other route's behavior changes.

## Verification Commands

- `cd packages/api && bun run typecheck`
- `cd packages/api && bun run test`
- `bun run check`

## Out of Scope

- Any Ludo-specific game token logic (task 23 builds on this fix but is a
  separate task).
- Refresh token rotation/expiry policy changes.
- Web admin cookie/session auth (unaffected by this bug).

## Commit message

`fix(auth): sign refreshed access tokens with the firebase uid, not email [15-ludo-launch/14]`
