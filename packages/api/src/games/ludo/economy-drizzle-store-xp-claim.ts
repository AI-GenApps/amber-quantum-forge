import { and, type db, eq, ludoXpClaims, sql } from "@repo/db";
import type { LudoEnvironment } from "./contracts";
import { toXpClaimRow } from "./economy-drizzle-store";
import { LUDO_ECONOMY_STORE_APP_ID, type LudoRecordXpClaimWithCapResult } from "./economy-store";

function toDate(value: string): Date {
  return new Date(value);
}

/**
 * Split out of `economy-drizzle-store.ts` to keep that file under the
 * repo's max-file-lines limit. Implements
 * `DrizzleLudoEconomyStore.recordXpClaimWithCap` — the atomic
 * check-then-write fix for the offline daily XP cap TOCTOU (a separate
 * `sumXpClaimed` read followed by a `recordXpClaim` insert let two
 * concurrent claims for the same subject/day both read the same
 * pre-claim sum, both pass the cap check, and both insert, exceeding the
 * cap). Everything below — the duplicate check, the daily-cap sum
 * re-read, and the insert — runs inside one transaction guarded by a
 * transaction-scoped advisory lock, so no concurrent caller for the same
 * (environment, subject, claimDate) can observe the sum before this
 * claim's row lands.
 */
export async function recordXpClaimWithCapImpl(
  database: typeof db,
  environment: LudoEnvironment,
  input: {
    subject: string;
    claimId: string;
    xpDelta: number;
    claimDate: string;
    dailyCap: number;
  },
  now: string,
): Promise<LudoRecordXpClaimWithCapResult> {
  return database.transaction(async (transaction) => {
    // A transaction-scoped advisory lock keyed on (app, environment,
    // subject, claim_date) — the same tuple the daily-cap sum below
    // filters on — serializes concurrent claims for the same
    // subject/day against each other. `hashtext` collisions only
    // over-serialize (briefly block unrelated subjects sharing a hash
    // bucket), they never under-serialize. The lock is released
    // automatically at commit/rollback.
    const lockKey = `${LUDO_ECONOMY_STORE_APP_ID}\u0000${environment}\u0000${input.subject}\u0000${input.claimDate}`;
    await transaction.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`);

    const [existing] = await transaction
      .select()
      .from(ludoXpClaims)
      .where(
        and(
          eq(ludoXpClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoXpClaims.environment, environment),
          eq(ludoXpClaims.subject, input.subject),
          eq(ludoXpClaims.claimId, input.claimId),
        ),
      )
      .limit(1);
    if (existing) {
      return { outcome: "duplicate", claim: toXpClaimRow(existing, environment) };
    }

    const rows = await transaction
      .select()
      .from(ludoXpClaims)
      .where(
        and(
          eq(ludoXpClaims.appId, LUDO_ECONOMY_STORE_APP_ID),
          eq(ludoXpClaims.environment, environment),
          eq(ludoXpClaims.subject, input.subject),
          eq(ludoXpClaims.claimDate, input.claimDate),
        ),
      );
    const totalClaimedToday = rows.reduce((total, row) => total + row.xpDelta, 0);
    if (totalClaimedToday + input.xpDelta > input.dailyCap) {
      return { outcome: "cap_exceeded", totalClaimedToday };
    }

    const values = {
      appId: LUDO_ECONOMY_STORE_APP_ID,
      environment,
      subject: input.subject,
      claimId: input.claimId,
      xpDelta: input.xpDelta,
      claimDate: input.claimDate,
      createdAt: toDate(now),
    };
    await transaction.insert(ludoXpClaims).values(values);
    return { outcome: "recorded", claim: toXpClaimRow(values, environment) };
  });
}
