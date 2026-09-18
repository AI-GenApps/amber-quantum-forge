import type { MergeSession } from "./contracts";
import { MergeRelayError } from "./errors";

export function requireRole(session: MergeSession, role: MergeSession["role"]): void {
  if (session.role !== role)
    throw new MergeRelayError(403, `${role}_role_required`, `The ${role} role is required`);
}

export function requirePlayer(session: MergeSession): void {
  requireRole(session, "player");
}
