import type {
  AchievementId,
  ChartSession,
  CometRefusal,
  Profile,
  RejectReason,
} from "@web-games/cloud-observatory-core";
import type { RecoveryReason } from "@web-games/kit";

export type Toast =
  | {
      readonly kind: "achievement";
      readonly id: AchievementId;
      readonly name: string;
      readonly description: string;
    }
  | { readonly kind: "lore"; readonly id: string; readonly title: string; readonly chapter: number }
  | { readonly kind: "chapter"; readonly chapter: number; readonly title: string };

export type CometStatus = "locked" | "ready" | "claimed" | "clock-went-back";

export type PersistenceState = "ok" | "read-failed";

export interface SessionSnapshot {
  readonly version: number;
  readonly loaded: boolean;
  readonly profile: Profile;
  readonly chart: ChartSession | null;
  readonly saveNotice: RecoveryReason | null;
  readonly persistence: PersistenceState;
}

export type SessionListener = (snapshot: SessionSnapshot, toasts: readonly Toast[]) => void;

export interface ActionResult {
  readonly ok: boolean;
  readonly reason?: RejectReason;
  readonly toasts: readonly Toast[];
}

export type CometResult =
  | {
      readonly ok: true;
      readonly reward: number;
      readonly shards: number;
      readonly streak: number;
      readonly toasts: readonly Toast[];
    }
  | { readonly ok: false; readonly reason: CometRefusal; readonly toasts: readonly Toast[] };

export interface LoadInfo {
  readonly status: "fresh" | "loaded" | "migrated" | "recovered";
  readonly reason?: RecoveryReason;
}
