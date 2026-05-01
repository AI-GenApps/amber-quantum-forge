import { verifyIdToken } from "@repo/api/firebase";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  isAllowlistedUid,
  signAdminSession,
} from "../../../../lib/admin-session";

export async function POST(req: Request) {
  let idToken: string | undefined;
  try {
    const body = (await req.json()) as { idToken?: string };
    idToken = body.idToken;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!idToken) {
    return NextResponse.json({ error: "idToken required" }, { status: 400 });
  }

  let decoded: Awaited<ReturnType<typeof verifyIdToken>>;
  try {
    decoded = await verifyIdToken(idToken);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid token" },
      { status: 401 },
    );
  }

  const hasAdminClaim = (decoded as { admin?: unknown }).admin === true;
  const allowlisted = isAllowlistedUid(decoded.uid);
  if (!hasAdminClaim && !allowlisted) {
    return NextResponse.json({ error: "Not an admin" }, { status: 403 });
  }

  const session = await signAdminSession({ uid: decoded.uid, email: decoded.email ?? null });
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, session, ADMIN_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true, uid: decoded.uid, allowlisted, hasAdminClaim });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  return NextResponse.json({ ok: true });
}
