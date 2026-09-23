import type { JsonObject } from "../contracts";
import type { MergeEnvironment, MergeSave, SaveRequest } from "./contracts";
import { requestFingerprint } from "./fingerprint";
import { asRecord, isEnvironment, isHex, isId, isTimestamp } from "./state-validation-helpers";

export interface MergeSaveWriteReceipt {
  receiptId: string;
  environment: MergeEnvironment;
  subject: string;
  saveId: string;
  clientWriteId: string;
  expectedVersion: number;
  schemaVersion: number;
  payload: JsonObject;
  payloadFingerprint: string;
  savedVersion: number;
  eventId: string;
  createdAt: string;
}

export interface MergeSaveWriteResult {
  save: MergeSave;
  receipt: MergeSaveWriteReceipt | null;
  replayed: boolean;
}

export function savePayloadFingerprint(
  input: Pick<SaveRequest, "schemaVersion" | "payload">,
): string {
  return requestFingerprint({ schemaVersion: input.schemaVersion, payload: input.payload });
}

export function saveReceiptRecordId(
  subject: string,
  saveId: string,
  clientWriteId: string,
): string {
  return `save_receipt_${requestFingerprint({ subject, saveId, clientWriteId })}`;
}

export function parseSaveWriteReceipt(value: unknown): MergeSaveWriteReceipt {
  if (!asRecord(value)) throw new Error("Merge Relay save write receipt is invalid");
  const copy = JSON.parse(JSON.stringify(value)) as MergeSaveWriteReceipt;
  if (
    !isId(copy.receiptId) ||
    !isEnvironment(copy.environment) ||
    !isId(copy.subject) ||
    !isId(copy.saveId) ||
    !isId(copy.clientWriteId) ||
    !Number.isSafeInteger(copy.expectedVersion) ||
    copy.expectedVersion < 0 ||
    copy.schemaVersion !== 1 ||
    !asRecord(copy.payload) ||
    !isHex(copy.payloadFingerprint) ||
    !Number.isSafeInteger(copy.savedVersion) ||
    copy.savedVersion < 1 ||
    !isId(copy.eventId) ||
    !isTimestamp(copy.createdAt) ||
    copy.receiptId !== saveReceiptRecordId(copy.subject, copy.saveId, copy.clientWriteId) ||
    copy.payloadFingerprint !== savePayloadFingerprint(copy)
  )
    throw new Error("Merge Relay save write receipt is invalid");
  return copy;
}
