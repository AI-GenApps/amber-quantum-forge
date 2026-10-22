import { randomUUID } from "node:crypto";
import type { MergeErrorResponse } from "./contracts";
import { MERGE_RELAY_CONTRACT_VERSION } from "./contracts";

export class MergeRelayError extends Error {
  readonly diagnosticId: string;

  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 503,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.diagnosticId = randomUUID();
  }

  response(): MergeErrorResponse {
    return {
      contract_version: MERGE_RELAY_CONTRACT_VERSION,
      error: { code: this.code, message: this.message, diagnostic_id: this.diagnosticId },
    };
  }
}

export function asMergeError(error: unknown): MergeRelayError {
  if (error instanceof MergeRelayError) return error;
  if (isUniqueViolation(error))
    return new MergeRelayError(
      409,
      "idempotency_conflict",
      "The request conflicts with an existing record",
    );
  return new MergeRelayError(503, "merge_relay_unavailable", "Merge Relay service is unavailable");
}

function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && typeof current === "object" && current !== null; depth += 1) {
    if ((current as { code?: unknown }).code === "23505") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}
