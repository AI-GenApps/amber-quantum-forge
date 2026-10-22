import type { Principal } from "./role-matrix-support";

export type Cell = readonly [status: number, code: string | null];
export type Expectation = Record<Principal, Cell>;

const unauthenticated: Cell = [401, "game_token_required"];
const invalid: Cell = [401, "invalid_game_token"];
const headerMismatch: Cell = [400, "client_app_scope_mismatch"];

export function publicRoute(cell: Cell): Expectation {
  return {
    none: cell,
    malformed_token: cell,
    expired_token: cell,
    wrong_secret: cell,
    wrong_app_claim: cell,
    wrong_environment_claim: cell,
    forged_role_claim: cell,
    app_header_mismatch: cell,
    player: cell,
    guest: cell,
    moderator: cell,
    game_admin: cell,
    service: cell,
  };
}

interface RoleCells {
  player: Cell;
  moderator: Cell;
  game_admin: Cell;
  service: Cell;
}

export function authed(roles: RoleCells): Expectation {
  return {
    none: unauthenticated,
    malformed_token: invalid,
    expired_token: invalid,
    wrong_secret: invalid,
    wrong_app_claim: invalid,
    wrong_environment_claim: invalid,
    forged_role_claim: invalid,
    app_header_mismatch: headerMismatch,
    player: roles.player,
    guest: roles.player,
    moderator: roles.moderator,
    game_admin: roles.game_admin,
    service: roles.service,
  };
}

export function anyRole(cell: Cell): Expectation {
  return authed({ player: cell, moderator: cell, game_admin: cell, service: cell });
}

export function playerOnly(allowed: Cell): Expectation {
  const denied: Cell = [403, "player_role_required"];
  return authed({ player: allowed, moderator: denied, game_admin: denied, service: denied });
}

export function adminOnly(allowed: Cell): Expectation {
  const denied: Cell = [403, "game_admin_role_required"];
  return authed({ player: denied, moderator: denied, game_admin: allowed, service: denied });
}

export function serviceOnly(allowed: Cell): Expectation {
  const denied: Cell = [403, "service_role_required"];
  return authed({ player: denied, moderator: denied, game_admin: denied, service: allowed });
}
