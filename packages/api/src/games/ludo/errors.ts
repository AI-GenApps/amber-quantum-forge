import { randomUUID } from "node:crypto";
import type { LudoErrorResponse } from "./contracts";
import { LUDO_CONTRACT_VERSION } from "./contracts";

export type LudoErrorCode =
  | "ludo_invalid_command"
  | "ludo_match_not_found"
  | "ludo_forbidden_role"
  | "ludo_token_configuration_unavailable"
  | "ludo_invalid_environment"
  | "ludo_authentication_required"
  | "ludo_unavailable";

export class LudoError extends Error {
  readonly diagnosticId: string;

  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 503,
    readonly code: LudoErrorCode,
    message: string,
  ) {
    super(message);
    this.diagnosticId = randomUUID();
  }

  response(): LudoErrorResponse {
    return {
      contract_version: LUDO_CONTRACT_VERSION,
      error: { code: this.code, message: this.message, diagnostic_id: this.diagnosticId },
    };
  }
}

export function asLudoError(error: unknown): LudoError {
  if (error instanceof LudoError) return error;
  return new LudoError(503, "ludo_unavailable", "Ludo service is unavailable");
}
