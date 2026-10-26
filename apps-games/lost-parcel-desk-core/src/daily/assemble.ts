import type { GlyphKind } from "../content";
import { deduction } from "../content/build";
import type { Clue, Deduction, FacetId } from "../types";
import { personById } from "./plan";
import { FLAVOUR_POOL, RULE_OUT_OBJECTS, templateFor } from "./templates";
import type { DailyCase, DailyObject, DailyPlan } from "./types";

const GLYPHS_BY_FACET: Record<FacetId, readonly [GlyphKind, GlyphKind]> = {
  street: ["bag", "cloth"],
  pastime: ["tin", "card"],
  look: ["glove", "paper"],
  pet: ["box", "ticket"],
};

export const DAILY_CAPTION = "One item from today's Daily Parcel.";

interface Item {
  name: string;
  tag: string;
  text: string;
  glyph: GlyphKind;
  flavour: boolean;
}

function leadItem(plan: DailyPlan, index: 0 | 1): Item {
  const facet = plan.facets[index];
  const kind = plan.kinds[index];
  const owner = personById(plan.ownerId);
  const target = personById(index === 0 ? plan.xId : plan.yId);
  if (kind === "rule-out") {
    const template = templateFor(facet, target.facets[facet]);
    if (template === undefined) throw new Error(`no template for ${facet}`);
    const name = RULE_OUT_OBJECTS[index];
    return {
      name,
      tag: template.ruleOut,
      text: `${name}: "${template.ruleOut}."`,
      glyph: "paper",
      flavour: false,
    };
  }
  const template = templateFor(facet, owner.facets[facet]);
  if (template === undefined) throw new Error(`no template for ${facet}`);
  const side = plan.sides[index] === 0 ? template.a : template.b;
  return {
    name: side.object,
    tag: side.tag,
    text: `${side.object}: ${side.tag}.`,
    glyph: GLYPHS_BY_FACET[facet][plan.sides[index]],
    flavour: false,
  };
}

function flavourItem(poolIndex: number): Item {
  const entry = FLAVOUR_POOL[poolIndex];
  if (entry === undefined) throw new Error(`no flavour line ${poolIndex}`);
  return {
    name: entry.object,
    tag: entry.line,
    text: `Among the contents: ${entry.line}.`,
    glyph: entry.glyph,
    flavour: true,
  };
}

export function assembleDaily(
  seed: number,
  weekday: number,
  plan: DailyPlan,
  attempt: number,
  fallback: boolean,
): DailyCase {
  const id = `daily-${seed >>> 0}`;
  const items = [leadItem(plan, 0), leadItem(plan, 1), ...plan.flavour.map(flavourItem)];
  const objects: DailyObject[] = [];
  const clues: Clue[] = [];
  const clueOfItem: string[] = [];
  plan.order.forEach((itemIndex, position) => {
    const item = items[itemIndex];
    if (item === undefined) throw new Error(`plan order points past the items: ${itemIndex}`);
    const objectId = `${id}-o${position + 1}`;
    const clueId = `${id}-c${position + 1}`;
    objects.push({ id: objectId, name: item.name, caption: DAILY_CAPTION, glyph: item.glyph });
    const clue: Clue = {
      id: clueId,
      objectId,
      face: plan.faces[position] ?? "front",
      tag: item.tag,
      text: item.text,
    };
    clues.push(item.flavour ? { ...clue, flavour: true } : clue);
    clueOfItem[itemIndex] = clueId;
  });
  const deductions: Deduction[] = ([0, 1] as const).map((index) => {
    const facet = plan.facets[index];
    const kind = plan.kinds[index];
    const owner = personById(plan.ownerId);
    const target = personById(index === 0 ? plan.xId : plan.yId);
    const value = kind === "direct" ? owner.facets[facet] : target.facets[facet];
    return deduction(`D${index + 1}`, facet, value, kind, [clueOfItem[index] ?? ""]);
  });
  return {
    id,
    ownerId: plan.ownerId,
    candidateIds: [...plan.candidateIds],
    objects,
    clues,
    deductions,
    weekday: ((weekday % 7) + 7) % 7,
    attempt,
    fallback,
  };
}
