/** m:ss for the fastest-solve record. */
export function formatTime(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return "-";
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** "23 Oct" from a yyyy-mm-dd key. */
export function shortDate(dateKey: string): string {
  const [, month, day] = dateKey.split("-");
  const name = MONTHS[Number(month) - 1];
  return name === undefined ? dateKey : `${Number(day)} ${name}`;
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
