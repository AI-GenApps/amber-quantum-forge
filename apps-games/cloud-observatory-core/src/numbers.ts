import { RULES } from "./constants";

const SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"] as const;
const WORD_NAMES = [
  "",
  "thousand",
  "million",
  "billion",
  "trillion",
  "quadrillion",
  "quintillion",
  "sextillion",
  "septillion",
  "octillion",
  "nonillion",
  "decillion",
] as const;
const CEILING_LABEL = "1.00e300+";

export function clampValue(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value > RULES.MAX_VALUE) return RULES.MAX_VALUE;
  if (value < -RULES.MAX_VALUE) return -RULES.MAX_VALUE;
  return value;
}

function trim(text: string): string {
  if (!text.includes(".")) return text;
  return text.replace(/0+$/, "").replace(/\.$/, "");
}

function groupIndex(value: number): number {
  let index = Math.max(1, Math.floor(Math.log10(value) / 3));
  while (index > 1 && value / 10 ** (3 * index) < 1) index -= 1;
  while (value / 10 ** (3 * index) >= 1000) index += 1;
  return index;
}

function threeSignificant(mantissa: number): string {
  if (mantissa < 10) return mantissa.toFixed(2);
  if (mantissa < 100) return mantissa.toFixed(1);
  return mantissa.toFixed(0);
}

function scientific(value: number): string {
  const text = value.toExponential(2).replace("e+", "e");
  return text === "1.00e300" ? CEILING_LABEL : text;
}

function formatPositive(value: number): string {
  if (value < 10) return trim(value.toFixed(2));
  if (value < 100) return trim(value.toFixed(1));
  if (value < 1000) {
    const rounded = Math.round(value);
    if (rounded < 1000) return String(rounded);
  }
  if (value >= 1e36) return scientific(value);
  let index = groupIndex(Math.max(value, 1000));
  let text = threeSignificant(value / 10 ** (3 * index));
  if (Number(text) >= 1000) {
    index += 1;
    text = threeSignificant(value / 10 ** (3 * index));
  }
  if (index >= SUFFIXES.length) return scientific(value);
  return `${text}${SUFFIXES[index]}`;
}

export function formatNumber(value: number): string {
  if (Number.isNaN(value)) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= RULES.MAX_VALUE) return value < 0 ? `-${CEILING_LABEL}` : CEILING_LABEL;
  const text = formatPositive(magnitude);
  if (value < 0 && text !== "0") return `-${text}`;
  return text;
}

function wordsPositive(value: number): string {
  if (value < 1000) return formatPositive(value);
  if (value >= 1e36) return formatPositive(value).replace("e", " times ten to the ");
  let index = groupIndex(value);
  let text = trim(threeSignificant(value / 10 ** (3 * index)));
  if (Number(text) >= 1000) {
    index += 1;
    text = trim(threeSignificant(value / 10 ** (3 * index)));
  }
  return `${text} ${WORD_NAMES[index] ?? ""}`.trim();
}

export function formatNumberWords(value: number): string {
  if (Number.isNaN(value)) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= RULES.MAX_VALUE) {
    return value < 0 ? "minus more than ten to the 300" : "more than ten to the 300";
  }
  const text = wordsPositive(magnitude);
  if (value < 0 && text !== "0") return `minus ${text}`;
  return text;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0s";
  const total = Math.floor(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (days > 0) return `${days}d ${pad(hours)}h`;
  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  if (minutes > 0) return `${minutes}m ${pad(secs)}s`;
  return `${secs}s`;
}
