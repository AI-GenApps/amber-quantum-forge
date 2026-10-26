import { FINALE_DAY, SCENES_PER_REGULAR } from "../constants";
import { shiftLengthForDay } from "../rules/day";
import { DECOR, noDecorEffects } from "../rules/decor";
import { BOOKS, DRINK_TOKENS, DRINKS, MOODS, PASTRIES, PASTRY_TOKENS } from "../rules/items";
import { patienceSeconds } from "../rules/patience";
import { weatherForDay } from "../rules/weather";
import { eligibleScenes } from "../story/eligibility";
import { addFp } from "../story/friendship";
import { ART_SLOT_IDS } from "./artSlots";
import { DAY_CARDS } from "./dayCards";
import { DAYS } from "./days";
import { DIARY } from "./diary";
import { FINALE } from "./finale";
import { issue, LIMITS } from "./issues";
import { REGULARS } from "./regulars";
import { SCENES } from "./scenes";
import { TUTORIAL_ORDERS } from "./tutorial";
import type { ContentBundle, ContentIssue } from "./types";
import { validateScenes } from "./validateScenes";
import { validateCharacters, validateLengths } from "./validateText";

export function defaultBundle(): ContentBundle {
  return {
    days: DAYS,
    regulars: REGULARS,
    scenes: SCENES,
    finale: FINALE,
    diary: DIARY,
    dayCards: DAY_CARDS,
    artSlotIds: ART_SLOT_IDS,
  };
}

const FP_PER_SERVE = 2;

function validateDays(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const { days } = bundle;
  if (days.length !== LIMITS.days || days.some((d, i) => d.day !== i + 1)) {
    issues.push(issue("DAY_TABLE", "days", "days must be 1 to 14 in order"));
  }
  let customers = 0;
  for (const day of days) {
    customers += day.customers;
    const where = `day ${day.day}`;
    if (day.weather !== weatherForDay(day.day))
      issues.push(issue("DAY_TABLE", where, "weather is not day mod 3"));
    if (day.shiftTicks !== shiftLengthForDay(day.day))
      issues.push(issue("DAY_TABLE", where, "shift length"));
    const seconds = patienceSeconds(day.day, day.weather, noDecorEffects());
    if (day.patienceSeconds !== seconds) {
      issues.push(
        issue("DAY_TABLE", where, `patience ${day.patienceSeconds}, rules say ${seconds}`),
      );
    }
    if (day.customers < day.regularsDue.length)
      issues.push(issue("DAY_TABLE", where, "fewer customers than regulars"));
    if (day.title.trim() === "") issues.push(issue("DAY_TABLE", where, "empty title"));
  }
  if (customers !== LIMITS.customers) {
    issues.push(issue("DAY_TABLE", "days", `${customers} customers, want ${LIMITS.customers}`));
  }
  const last = days[days.length - 1];
  if (last !== undefined && last.regularsDue.length !== bundle.regulars.length) {
    issues.push(issue("DAY_TABLE", "day 14", "Lantern Night must list every regular"));
  }
  return issues;
}

function campaignDays(bundle: ContentBundle, regularId: number): number[] {
  return bundle.days
    .filter((d) => d.day < FINALE_DAY && d.regularsDue.includes(regularId))
    .map((d) => d.day);
}

function validateCalendar(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  if (bundle.regulars.length !== LIMITS.regulars) {
    issues.push(issue("CALENDAR", "regulars", `${bundle.regulars.length} regulars, want 8`));
  }
  let campaign = 0;
  for (const day of bundle.days) {
    for (const id of day.regularsDue) {
      if (!bundle.regulars.some((r) => r.id === id)) {
        issues.push(issue("CALENDAR", `day ${day.day}`, `unknown regular ${id}`));
      }
    }
    if (new Set(day.regularsDue).size !== day.regularsDue.length) {
      issues.push(issue("CALENDAR", `day ${day.day}`, "regular listed twice"));
    }
    if (day.day < FINALE_DAY) campaign += day.regularsDue.length;
  }
  if (campaign !== LIMITS.regularVisitsCampaign) {
    issues.push(
      issue("VISIT_COUNT", "days", `${campaign} regular visits on Days 1 to 13, want 40`),
    );
  }
  for (const regular of bundle.regulars) {
    const computed = campaignDays(bundle, regular.id);
    if (computed.length !== SCENES_PER_REGULAR) {
      issues.push(
        issue("VISIT_COUNT", `regular ${regular.id}`, `${computed.length} visits, want 5`),
      );
    }
    if (computed.join(",") !== regular.visitDays.join(",")) {
      issues.push(
        issue(
          "CALENDAR",
          `regular ${regular.id}`,
          `calendar ${computed.join(",")} differs from ${regular.visitDays.join(",")}`,
        ),
      );
    }
  }
  return issues;
}

function validateReachability(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  for (const regular of bundle.regulars) {
    const visitDays = campaignDays(bundle, regular.id);
    for (let k = 1; k <= SCENES_PER_REGULAR; k++) {
      const visits = Math.min(k, visitDays.length);
      let fp = 0;
      for (let v = 0; v < visits; v++) fp = addFp(fp, FP_PER_SERVE);
      const ready = eligibleScenes([{ regularId: regular.id, fp, visits, scenesDone: k - 1 }]);
      const exists = bundle.scenes.some((s) => s.regular === regular.id && s.index === k);
      if (!exists || visitDays.length < k || !ready.some((r) => r.index === k)) {
        issues.push(
          issue(
            "UNREACHABLE_ARC",
            `regular ${regular.id}`,
            `scene ${k} is not eligible at visit ${k}`,
          ),
        );
        break;
      }
    }
  }
  return issues;
}

function collect(
  issues: ContentIssue[],
  day: number,
  label: string,
  ids: readonly string[],
  known: readonly string[],
  into: Set<string>,
): void {
  for (const id of ids) {
    if (known.includes(id)) into.add(id);
    else issues.push(issue("UNKNOWN_ITEM", `day ${day}`, `${label} ${id}`));
  }
}

function validateItems(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const counts = [DRINKS.length, PASTRIES.length, BOOKS.length, MOODS.length, DECOR.length];
  if (counts.join(",") !== "6,5,5,5,8") {
    issues.push(issue("UNKNOWN_ITEM", "items", `item counts ${counts.join(",")}, want 6,5,5,5,8`));
  }
  for (const drink of DRINKS) {
    if (drink.steps.some((t) => !DRINK_TOKENS.includes(t)))
      issues.push(issue("UNKNOWN_ITEM", drink.id, "bad step token"));
  }
  for (const pastry of PASTRIES) {
    if (pastry.steps.some((t) => !PASTRY_TOKENS.includes(t)))
      issues.push(issue("UNKNOWN_ITEM", pastry.id, "bad step token"));
  }
  for (const mood of MOODS) {
    const carried = BOOKS.filter((b) => b.moods.includes(mood)).length;
    if (carried !== 2)
      issues.push(issue("UNKNOWN_ITEM", mood, `carried by ${carried} books, want 2`));
  }
  for (const book of BOOKS) {
    if (new Set(book.moods).size !== 2)
      issues.push(issue("UNKNOWN_ITEM", book.id, "needs two distinct moods"));
  }
  for (const regular of bundle.regulars) {
    const likes = regular.likes;
    const where = `regular ${regular.id}`;
    if (!DRINKS.some((d) => d.id === likes.drink))
      issues.push(issue("UNKNOWN_ITEM", where, `drink ${likes.drink}`));
    if (!PASTRIES.some((p) => p.id === likes.pastry))
      issues.push(issue("UNKNOWN_ITEM", where, `pastry ${likes.pastry}`));
    for (const mood of likes.moods) {
      if (!MOODS.includes(mood)) issues.push(issue("UNKNOWN_ITEM", where, `mood ${mood}`));
    }
  }
  const drinks = new Set<string>();
  const pastries = new Set<string>();
  const books = new Set<string>();
  const decor = new Set<string>();
  for (const day of bundle.days) {
    const u = day.unlocks;
    collect(
      issues,
      day.day,
      "drink",
      u.drinks,
      DRINKS.map((d) => d.id),
      drinks,
    );
    collect(
      issues,
      day.day,
      "pastry",
      u.pastries,
      PASTRIES.map((p) => p.id),
      pastries,
    );
    collect(
      issues,
      day.day,
      "book",
      u.books,
      BOOKS.map((b) => b.id),
      books,
    );
    for (const id of u.decor) {
      const rule = DECOR.find((d) => d.id === id);
      if (rule === undefined) issues.push(issue("UNKNOWN_ITEM", `day ${day.day}`, `decor ${id}`));
      else if (rule.unlockDay !== day.day)
        issues.push(
          issue("UNKNOWN_ITEM", `day ${day.day}`, `${id} unlocks on day ${rule.unlockDay}`),
        );
      else decor.add(id);
    }
    if (day.day === 11 && (drinks.size !== 6 || pastries.size !== 5 || books.size !== 5)) {
      issues.push(
        issue("DAY_TABLE", "day 11", "all drinks, pastries and books must be unlocked by Day 11"),
      );
    }
  }
  if (decor.size !== DECOR.length)
    issues.push(issue("DAY_TABLE", "days", "every decor item must unlock on a day"));
  for (const entry of TUTORIAL_ORDERS) {
    const { drink, pastry } = entry.order;
    if (!DRINKS.some((d) => d.id === drink))
      issues.push(issue("UNKNOWN_ITEM", entry.id, `drink ${drink}`));
    if (pastry !== null && !PASTRIES.some((p) => p.id === pastry))
      issues.push(issue("UNKNOWN_ITEM", entry.id, `pastry ${pastry}`));
  }
  return issues;
}

function validateArt(bundle: ContentBundle): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const ids = bundle.artSlotIds;
  if (ids.size !== LIMITS.artSlots)
    issues.push(issue("UNKNOWN_ART_SLOT", "art slots", `${ids.size} slots, want 54`));
  const wanted: string[] = [
    "icon",
    "key-art",
    "feature-graphic",
    "interior-morning",
    "interior-evening",
    "interior-rain",
    ...DRINKS.map((d) => d.id),
    ...PASTRIES.map((p) => p.id),
    ...BOOKS.map((b) => b.id),
    ...DECOR.map((d) => d.id),
  ];
  for (const regular of bundle.regulars) {
    for (const face of ["neutral", "happy", "sad"]) wanted.push(`${regular.artPrefix}-${face}`);
  }
  for (const id of wanted) {
    if (!ids.has(id)) issues.push(issue("UNKNOWN_ART_SLOT", id, "slot is not in the art list"));
  }
  return issues;
}

export function validateContent(bundle: ContentBundle = defaultBundle()): ContentIssue[] {
  return [
    ...validateDays(bundle),
    ...validateCalendar(bundle),
    ...validateItems(bundle),
    ...validateScenes(bundle),
    ...validateReachability(bundle),
    ...validateLengths(bundle),
    ...validateArt(bundle),
    ...validateCharacters(bundle),
  ];
}
