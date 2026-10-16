export type SaveNoticeKind =
  | "recovered-pending"
  | "recovered-backup"
  | "reset"
  | "read-failed"
  | "write-failed";

/** A non-blocking message for the UI. The game keeps running whatever the notice says. */
export interface SaveNotice {
  kind: SaveNoticeKind;
  message: string;
}

export const NOTICE_MESSAGES: Readonly<Record<SaveNoticeKind, string>> = {
  "recovered-pending": "Your progress file was damaged. We restored your latest saved progress.",
  "recovered-backup": "Your progress file was damaged. We restored an earlier backup.",
  reset: "Your progress file was damaged and could not be restored. Starting fresh.",
  "read-failed": "Saved progress could not be read on this device. Starting fresh.",
  "write-failed": "Progress could not be saved. We will try again after your next change.",
};

export function notice(kind: SaveNoticeKind): SaveNotice {
  return { kind, message: NOTICE_MESSAGES[kind] };
}
