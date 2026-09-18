import { randomUUID } from "node:crypto";
import type { MergeErrorResponse } from "./contracts";
import { MERGE_RELAY_CONTRACT_VERSION } from "./contracts";

export class MergeRelayError extends Error {
  readonly diagnosticId: string;

  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 503,
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
  return new MergeRelayError(503, "merge_relay_unavailable", "Merge Relay service is unavailable");
}
