import { join } from "node:path";
import {
  CONSTELLATIONS,
  INSTRUMENTS,
  LORE,
  LORE_CHAPTERS,
  RULES,
} from "@web-games/cloud-observatory-core";
import { describe, expect, it } from "vitest";
import { GAME_TITLE } from "../../src/brand";
import { APP, KB, readText, walk } from "./paths";

const listing = readText(join(KB, "store-listing.md"));

function block(name: string): string {
  const fence = "`".repeat(3);
  const match = listing.match(new RegExp(`${fence}text ${name}\\n([\\s\\S]*?)\\n${fence}`));
  if (!match?.[1]) throw new Error(`store-listing.md has no \`\`\`text ${name} block`);
  return match[1];
}

const tableCell = (field: string): string => {
  const row = listing.split("\n").find((line) => line.startsWith(`| ${field}`));
  if (!row) throw new Error(`store-listing.md has no row for ${field}`);
  return row.split("|")[2]?.trim() ?? "";
};

const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}|‍|️/u;

/** Sentences allowed to mention a feature the game does not have, because they deny it. */
const NEGATED_SENTENCES: readonly string[] = ["No ads."];
const DENYLIST: readonly RegExp[] = [
  /multiplayer/i,
  /leaderboard/i,
  /\bads\b/i,
  /in-app purchase/i,
  /subscription/i,
  /online/i,
];

const sentencesOf = (text: string): string[] =>
  text
    .replaceAll("\n", " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

describe("store listing text", () => {
  it("keeps the name within 30 characters and equal to the game title", () => {
    const name = tableCell("App name").match(/\*\*(.+?)\*\*/)?.[1] ?? "";
    expect(name).toBe(GAME_TITLE);
    expect(name.length).toBeGreaterThan(0);
    expect(name.length).toBeLessThanOrEqual(30);
  });

  it("keeps the short description within 80 characters and non-empty", () => {
    const short = block("short-description");
    expect(short.trim().length).toBeGreaterThan(0);
    expect(short.length).toBeLessThanOrEqual(80);
  });

  it("keeps the full description non-empty and within 4,000 characters", () => {
    const full = block("full-description");
    expect(full.trim().length).toBeGreaterThan(500);
    expect(full.length).toBeLessThanOrEqual(4000);
  });

  it("keeps what's new non-empty and within 500 characters", () => {
    const news = block("whats-new");
    expect(news.trim().length).toBeGreaterThan(0);
    expect(news.length).toBeLessThanOrEqual(500);
  });

  it("uses no emoji in any field", () => {
    for (const name of ["short-description", "full-description", "whats-new"]) {
      expect(EMOJI.test(block(name)), name).toBe(false);
    }
    expect(EMOJI.test(listing)).toBe(false);
  });

  it("mentions a feature the game lacks only inside an allowed negated sentence", () => {
    for (const name of ["short-description", "full-description", "whats-new"]) {
      for (const sentence of sentencesOf(block(name))) {
        for (const word of DENYLIST) {
          if (word.test(sentence)) {
            expect(NEGATED_SENTENCES, `${name}: "${sentence}"`).toContain(sentence);
          }
        }
      }
    }
  });

  it("the denylist and allowlist really catch an invented claim", () => {
    const claim = "Compete on the global leaderboard in multiplayer.";
    expect(DENYLIST.some((word) => word.test(claim))).toBe(true);
    expect(NEGATED_SENTENCES).not.toContain(claim);
  });
});

describe("store listing claims match the code", () => {
  const full = block("full-description").replaceAll(/\s+/g, " ");

  it("names all twelve constellations the catalog has", () => {
    expect(CONSTELLATIONS).toHaveLength(12);
    for (const constellation of CONSTELLATIONS) {
      const name = constellation.name.replace(/^The /, "");
      expect(full, constellation.name).toContain(`the ${name}`);
    }
  });

  it("states the instrument, upgrade, lore, chapter and offline numbers", () => {
    expect(full).toContain("eight instruments");
    expect(INSTRUMENTS).toHaveLength(8);
    expect(full).toContain("Each instrument has three upgrades");
    expect(full).toContain("Thirty short journal entries in six chapters");
    expect(LORE).toHaveLength(30);
    expect(LORE_CHAPTERS).toHaveLength(6);
    expect(full).toContain("up to eight hours");
    expect(RULES.OFFLINE_CAP_SECONDS).toBe(8 * 3600);
  });

  it("uses the app id from capacitor.config.ts", () => {
    const config = readText(join(APP, "capacitor.config.ts"));
    const configId = config.match(/appId:\s*"([^"]+)"/)?.[1];
    const listed = tableCell("Package / bundle id").replaceAll("`", "");
    expect(configId).toBe("app.w3dev.cloudobservatory");
    expect(listed).toBe(configId);
    expect(config).toContain(`appName: "${GAME_TITLE}"`);
  });

  it("declares no permissions, matching the Android manifest", () => {
    const manifest = readText(join(APP, "android/app/src/main/AndroidManifest.xml"));
    expect(manifest).not.toMatch(/<uses-permission/);
    expect(tableCell("Permissions requested")).toMatch(/^None\./);
  });

  it("promises no Share feature unless a source file uses the share plugin", () => {
    const usesShare = walk(join(APP, "src")).some((file) =>
      /capacitor\/share|navigator\.share/.test(readText(file)),
    );
    const row = tableCell("Share feature");
    expect(usesShare).toBe(false);
    expect(row).toMatch(/^None in v1/);
  });
});
