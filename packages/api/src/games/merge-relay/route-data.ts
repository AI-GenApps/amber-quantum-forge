import {
  getSave,
  provisionInitialConfig,
  putSaveWithReceipt,
  recordEvent,
  recordSocial,
  rollbackConfig,
  updateConfig,
} from "./data-service";
import { grantReward } from "./reward-service";
import type { MergeRelayRouteDependencies, MergeRoutes } from "./route-context";
import { fail, readBody, respond } from "./route-context";
import {
  isSafeId,
  parseConfigRollback,
  parseConfigUpdate,
  parseEvent,
  parseReward,
  parseSave,
  parseSocial,
} from "./validation";
import {
  configToWire,
  eventToWire,
  rewardToWire,
  saveReceiptToWire,
  saveToWire,
  socialToWire,
} from "./wire";

export function registerDataRoutes(
  routes: MergeRoutes,
  dependencies: MergeRelayRouteDependencies,
): void {
  routes.get("/:environment/saves/:saveId", async (c) => {
    const saveId = c.req.param("saveId");
    if (!isSafeId(saveId)) return fail(c, 400, "invalid_save_id", "Save ID is invalid");
    const save = await getSave(dependencies, c.get("environment"), c.get("session"), saveId);
    if (!save) return fail(c, 404, "save_not_found", "Save was not found");
    return respond(c, { save: saveToWire(save) });
  });

  routes.put("/:environment/saves/:saveId", async (c) => {
    const saveId = c.req.param("saveId");
    const input = parseSave(await readBody(c));
    if (!isSafeId(saveId) || !input) return fail(c, 422, "invalid_save", "Save payload is invalid");
    const result = await putSaveWithReceipt(
      dependencies,
      c.get("environment"),
      c.get("session"),
      saveId,
      input,
    );
    return respond(c, {
      save: saveToWire(result.save),
      write_receipt: saveReceiptToWire(result.receipt, result.replayed),
    });
  });

  routes.post("/:environment/rewards", async (c) => {
    if (c.get("session").role !== "service")
      return fail(c, 403, "service_role_required", "A service role is required");
    const input = parseReward(await readBody(c));
    if (!input) return fail(c, 422, "invalid_reward", "Reward payload is invalid");
    return respond(c, {
      reward: rewardToWire(
        await grantReward(dependencies, c.get("environment"), c.get("session"), input),
      ),
    });
  });

  routes.post("/:environment/events", async (c) => {
    const input = parseEvent(await readBody(c));
    if (!input) return fail(c, 422, "invalid_event", "Event payload is invalid");
    return respond(c, {
      event: eventToWire(
        await recordEvent(dependencies, c.get("environment"), c.get("session"), input),
      ),
    });
  });

  routes.post("/:environment/social/:action", async (c) => {
    const action = c.req.param("action");
    if (action !== "report" && action !== "block")
      return fail(c, 404, "social_action_not_found", "Social action was not found");
    const input = parseSocial(await readBody(c));
    if (!input) return fail(c, 422, "invalid_social", "Social payload is invalid");
    return respond(
      c,
      {
        record: socialToWire(
          await recordSocial(dependencies, c.get("environment"), c.get("session"), action, input),
        ),
      },
      201,
    );
  });

  routes.put("/:environment/config", async (c) => {
    if (c.get("session").role !== "game_admin")
      return fail(c, 403, "game_admin_role_required", "A game administrator role is required");
    const input = parseConfigUpdate(await readBody(c));
    if (!input) return fail(c, 422, "invalid_config", "Configuration payload is invalid");
    return respond(c, {
      config: configToWire(
        await updateConfig(dependencies, c.get("environment"), c.get("session"), input),
      ),
    });
  });

  routes.post("/:environment/config/bootstrap", async (c) => {
    const role = c.get("session").role;
    if (role !== "game_admin" && role !== "service")
      return fail(
        c,
        403,
        "config_bootstrap_role_required",
        "A game administrator or service role is required",
      );
    return respond(c, {
      config: configToWire(
        await provisionInitialConfig(dependencies, c.get("environment"), c.get("session")),
      ),
    });
  });

  routes.post("/:environment/config/rollback", async (c) => {
    if (c.get("session").role !== "game_admin")
      return fail(c, 403, "game_admin_role_required", "A game administrator role is required");
    const input = parseConfigRollback(await readBody(c));
    if (!input)
      return fail(c, 422, "invalid_config_rollback", "Configuration rollback payload is invalid");
    return respond(c, {
      config: configToWire(
        await rollbackConfig(dependencies, c.get("environment"), c.get("session"), input),
      ),
    });
  });
}
