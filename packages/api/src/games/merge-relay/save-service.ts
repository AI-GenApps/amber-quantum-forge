import { createHash } from "node:crypto";
import { parseGuestArtifact, parseSaveArtifact } from "./artifact-parsers";
import { artifactRecordId } from "./artifact-store";
import { requirePlayer } from "./authorization";
import type { MergeEnvironment, MergeSave, MergeSession, SaveRequest } from "./contracts";
import type { MergeRelayServiceDependencies } from "./dependencies";
import { MergeRelayError } from "./errors";
import {
  type MergeSaveWriteReceipt,
  type MergeSaveWriteResult,
  parseSaveWriteReceipt,
  savePayloadFingerprint,
  saveReceiptRecordId,
} from "./save-contracts";

export async function getSave(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  saveId: string,
): Promise<MergeSave | null> {
  requirePlayer(session);
  const page = await dependencies.store.readArtifacts(
    environment,
    { recordType: "save", recordId: artifactRecordId(session.subject, saveId), limit: 1 },
    parseSaveArtifact,
  );
  return page.items[0] ?? null;
}

export async function putSave(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  saveId: string,
  input: SaveRequest,
): Promise<MergeSave> {
  return (await putSaveWithReceipt(dependencies, environment, session, saveId, input)).save;
}

export async function putSaveWithReceipt(
  dependencies: MergeRelayServiceDependencies,
  environment: MergeEnvironment,
  session: MergeSession,
  saveId: string,
  input: SaveRequest,
): Promise<MergeSaveWriteResult> {
  requirePlayer(session);
  const payloadFingerprint = savePayloadFingerprint(input);
  return dependencies.store.transactArtifacts(environment, async (transaction) => {
    const subject = await resolveWriteSubject(transaction, session.subject);
    const existingReceipt = input.clientWriteId
      ? await transaction.read(
          {
            recordType: "save_write_receipt",
            recordId: saveReceiptRecordId(subject, saveId, input.clientWriteId),
          },
          parseSaveWriteReceipt,
        )
      : null;
    if (existingReceipt)
      return replayOrReject(
        existingReceipt,
        input,
        environment,
        subject,
        saveId,
        payloadFingerprint,
      );
    const existing = await transaction.read(
      { recordType: "save", recordId: artifactRecordId(subject, saveId) },
      parseSaveArtifact,
    );
    const currentVersion = existing?.version ?? 0;
    if (input.expectedVersion !== currentVersion)
      throw new MergeRelayError(
        409,
        "save_version_conflict",
        "Save changed on another device; fetch the current save before retrying",
      );
    const now = dependencies.clock.now().toISOString();
    const record: MergeSave = {
      saveId,
      subject,
      schemaVersion: input.schemaVersion,
      version: currentVersion + 1,
      payload: clone(input.payload),
      payloadFingerprint,
      updatedAt: now,
    };
    const eventId = eventIdFor(environment, subject, `save:${saveId}:${record.version}`);
    const event = {
      eventId,
      idempotencyKey: `save:${subject}:${saveId}:${record.version}`,
      subject,
      type: "checkpoint_saved",
      artifactId: saveId,
      payload: {
        version: record.version,
        payload_fingerprint: payloadFingerprint,
        client_write_id: input.clientWriteId ?? null,
      },
      requestFingerprint: payloadFingerprint,
      createdAt: now,
    } satisfies import("./contracts").MergeEvent;
    await transaction.put("save", artifactRecordId(subject, saveId), record, {
      ownerSubject: subject,
    });
    await transaction.put("event", event.eventId, event, {
      ownerSubject: subject,
      idempotencyKey: event.idempotencyKey,
    });
    const writeReceipt = input.clientWriteId
      ? createReceipt(environment, subject, saveId, input, record, payloadFingerprint, eventId)
      : null;
    if (writeReceipt)
      await transaction.put("save_write_receipt", writeReceipt.receiptId, writeReceipt, {
        ownerSubject: subject,
        idempotencyKey: writeReceipt.receiptId,
      });
    return { save: record, receipt: writeReceipt, replayed: false };
  });
}

async function resolveWriteSubject(
  transaction: import("./artifact-store").MergeRelayArtifactTransaction,
  subject: string,
): Promise<string> {
  if (!subject.startsWith("guest_")) return subject;
  const guest = await transaction.read(
    { recordType: "guest", recordId: subject },
    parseGuestArtifact,
  );
  return guest?.upgradedSubject ?? subject;
}

function replayOrReject(
  receipt: MergeSaveWriteReceipt,
  input: SaveRequest,
  environment: MergeEnvironment,
  subject: string,
  saveId: string,
  payloadFingerprint: string,
): MergeSaveWriteResult {
  if (
    receipt.environment !== environment ||
    receipt.subject !== subject ||
    receipt.saveId !== saveId ||
    receipt.expectedVersion !== input.expectedVersion ||
    receipt.schemaVersion !== input.schemaVersion ||
    receipt.payloadFingerprint !== payloadFingerprint
  )
    throw new MergeRelayError(
      409,
      "save_write_id_conflict",
      "The client write ID is attached to a different save payload",
    );
  return {
    save: {
      saveId: receipt.saveId,
      subject: receipt.subject,
      schemaVersion: receipt.schemaVersion,
      version: receipt.savedVersion,
      payload: clone(receipt.payload),
      payloadFingerprint: receipt.payloadFingerprint,
      updatedAt: receipt.createdAt,
    },
    receipt,
    replayed: true,
  };
}

function createReceipt(
  environment: MergeEnvironment,
  subject: string,
  saveId: string,
  input: SaveRequest,
  record: MergeSave,
  payloadFingerprint: string,
  eventId: string,
): MergeSaveWriteReceipt {
  const clientWriteId = input.clientWriteId;
  if (!clientWriteId) throw new Error("Save receipt requires a client write ID");
  return {
    receiptId: saveReceiptRecordId(subject, saveId, clientWriteId),
    environment,
    subject,
    saveId,
    clientWriteId,
    expectedVersion: input.expectedVersion,
    schemaVersion: record.schemaVersion,
    payload: clone(record.payload),
    payloadFingerprint,
    savedVersion: record.version,
    eventId,
    createdAt: record.updatedAt,
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function eventIdFor(environment: MergeEnvironment, subject: string, key: string): string {
  return `evt_${createHash("sha256")
    .update(`${environment}\u0000${subject}\u0000${key}`)
    .digest("hex")}`;
}
