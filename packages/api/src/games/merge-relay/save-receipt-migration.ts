import type { MergeRelayArtifactTransaction } from "./artifact-store";
import { MergeRelayError } from "./errors";
import {
  type MergeSaveWriteReceipt,
  parseSaveWriteReceipt,
  saveReceiptRecordId,
} from "./save-contracts";

export async function migrateSaveWriteReceipts(
  transaction: MergeRelayArtifactTransaction,
  guestSubject: string,
  accountSubject: string,
): Promise<void> {
  const receipts = await listReceipts(transaction, guestSubject);
  for (const receipt of receipts) {
    const migratedId = saveReceiptRecordId(accountSubject, receipt.saveId, receipt.clientWriteId);
    const existing = await transaction.read(
      { recordType: "save_write_receipt", recordId: migratedId },
      parseSaveWriteReceipt,
    );
    if (
      existing &&
      (existing.expectedVersion !== receipt.expectedVersion ||
        existing.schemaVersion !== receipt.schemaVersion ||
        existing.payloadFingerprint !== receipt.payloadFingerprint)
    )
      throw new MergeRelayError(
        409,
        "guest_upgrade_conflict",
        "Account already owns a save receipt with the same write ID",
      );
    await transaction.remove("save_write_receipt", receipt.receiptId);
    if (existing) continue;
    await transaction.put(
      "save_write_receipt",
      migratedId,
      { ...receipt, receiptId: migratedId, subject: accountSubject },
      { ownerSubject: accountSubject, idempotencyKey: migratedId },
    );
  }
}

async function listReceipts(
  transaction: MergeRelayArtifactTransaction,
  subject: string,
): Promise<MergeSaveWriteReceipt[]> {
  const receipts: MergeSaveWriteReceipt[] = [];
  let afterRecordId: string | undefined;
  do {
    const page = await transaction.list(
      {
        recordType: "save_write_receipt",
        ownerSubject: subject,
        limit: 100,
        ...(afterRecordId === undefined ? {} : { afterRecordId }),
      },
      parseSaveWriteReceipt,
    );
    receipts.push(...page.items);
    afterRecordId = page.nextCursor ?? undefined;
  } while (afterRecordId !== undefined);
  return receipts;
}
