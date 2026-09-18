import { getConfig, getDaily, provisionDaily } from "./data-service";
import { createGuest, recoverGuest } from "./identity-service";
import { resolveChallenge } from "./relay-queries";
import type { MergeRelayRouteDependencies, MergeRoutes } from "./route-context";
import { fail, readBody, respond } from "./route-context";
import { isSafeId, isValidDailyDate, parseGuestRecovery } from "./validation";
import { configToWire, dailyToWire, guestToWire, publicChallengeToWire } from "./wire";

export function registerPublicRoutes(
  routes: MergeRoutes,
  dependencies: MergeRelayRouteDependencies,
): void {
  routes.post("/:environment/guest", async (c) => {
    const environment = c.get("environment");
    const guest = await createGuest(dependencies, environment);
    const accessToken = dependencies.issueGuestToken
      ? await dependencies.issueGuestToken(environment, guest.subject)
      : null;
    return respond(c, {
      guest: guestToWire({
        guestId: guest.guestId,
        subject: guest.subject,
        recoveryTokenHash: "",
        upgradedSubject: null,
        createdAt: dependencies.clock.now().toISOString(),
        upgradedAt: null,
      }),
      recovery_token: guest.recoveryToken,
      access_token: accessToken,
    });
  });

  routes.post("/:environment/guest/recover", async (c) => {
    const input = parseGuestRecovery(await readBody(c));
    if (!input) return fail(c, 422, "invalid_guest_recovery", "Guest recovery payload is invalid");
    const recovery = await recoverGuest(dependencies, c.get("environment"), input);
    const accessToken = dependencies.issueGuestToken
      ? await dependencies.issueGuestToken(c.get("environment"), recovery.subject)
      : null;
    return respond(c, {
      guest_id: recovery.guestId,
      subject: recovery.subject,
      upgraded_subject: recovery.upgradedSubject,
      access_token: accessToken,
    });
  });

  routes.get("/:environment/challenges/:challengeId/resolve", async (c) => {
    const challengeId = c.req.param("challengeId");
    if (!isSafeId(challengeId))
      return fail(c, 400, "invalid_challenge_id", "Challenge ID is invalid");
    return respond(
      c,
      publicChallengeToWire(
        await resolveChallenge(dependencies, c.get("environment"), challengeId),
      ),
    );
  });

  routes.get("/:environment/daily/:date", async (c) => {
    const date = c.req.param("date");
    if (!isValidDailyDate(date))
      return fail(c, 400, "invalid_daily_date", "Daily date must use YYYY-MM-DD");
    return respond(c, dailyToWire(await getDaily(dependencies, c.get("environment"), date)));
  });

  routes.post("/:environment/daily/:date/provision", async (c) => {
    const date = c.req.param("date");
    if (!isValidDailyDate(date))
      return fail(c, 400, "invalid_daily_date", "Daily date must use YYYY-MM-DD");
    return respond(
      c,
      {
        daily: dailyToWire(
          await provisionDaily(dependencies, c.get("environment"), c.get("session"), date),
        ),
      },
      201,
    );
  });

  routes.get("/:environment/config", async (c) =>
    respond(c, configToWire(await getConfig(dependencies, c.get("environment")))),
  );
}
