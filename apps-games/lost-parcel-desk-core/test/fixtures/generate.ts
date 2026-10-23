import { analyseCase } from "../../src/analyse";
import type { Prng } from "../../src/prng";
import type {
  CaseDef,
  Clue,
  ClueFace,
  Deduction,
  DeductionKind,
  FacetId,
  Person,
} from "../../src/types";

const FACET_LIST: FacetId[] = ["street", "pastime", "look", "pet"];
const FACES: ClueFace[] = ["front", "zoom", "back"];
const OBJECT_COUNT = 4;

interface Option {
  facet: FacetId;
  polarity: Deduction["polarity"];
  value: string;
  kind: DeductionKind;
}

function optionsFor(rng: Prng, people: readonly Person[], owner: Person): Option[] {
  const options: Option[] = [];
  for (const facet of FACET_LIST) {
    const own = owner.facets[facet];
    const kind: DeductionKind = rng.int(2) === 0 ? "direct" : "pair";
    options.push({ facet, polarity: "is", value: own, kind });
    const others = [...new Set(people.map((person) => person.facets[facet]))].filter(
      (value) => value !== own,
    );
    for (const value of others) options.push({ facet, polarity: "isnot", value, kind: "rule-out" });
  }
  return options;
}

function build(rng: Prng, id: string, ownerId: string, candidateIds: string[], picks: Option[]) {
  const objects = Array.from({ length: OBJECT_COUNT }, (_, index) => ({
    id: `${id}-o${index + 1}`,
    name: `Object ${index + 1}`,
    caption: `Caption ${index + 1}`,
  }));
  const slots = rng.shuffle(
    objects.flatMap((object) => FACES.map((face) => ({ objectId: object.id, face }))),
  );
  const clues: Clue[] = [];
  const take = (flavour: boolean): Clue => {
    const slot = slots.shift();
    if (slot === undefined) throw new Error("out of slots");
    const clueId = `${id}-c${clues.length + 1}`;
    const clue: Clue = { id: clueId, ...slot, tag: `tag ${clueId}`, text: `text ${clueId}` };
    const stored = flavour ? { ...clue, flavour: true } : clue;
    clues.push(stored);
    return stored;
  };
  const deductions: Deduction[] = picks.map((pick, index) => ({
    id: `${id}-D${index + 1}`,
    ...pick,
    clueIds: Array.from({ length: pick.kind === "pair" ? 2 : 1 }, () => take(false).id),
  }));
  for (const object of objects) {
    if (clues.some((clue) => clue.objectId === object.id)) continue;
    const at = slots.findIndex((slot) => slot.objectId === object.id);
    const [slot] = slots.splice(at, 1);
    if (slot !== undefined) slots.unshift(slot);
    take(true);
  }
  return { id, ownerId, candidateIds, objects, clues, deductions } satisfies CaseDef;
}

export function generateMiniCase(rng: Prng, people: readonly Person[], id: string): CaseDef {
  for (let attempt = 0; attempt < 4000; attempt++) {
    const candidates = rng.shuffle(people).slice(0, 3);
    const owner = rng.pick(candidates);
    const options = optionsFor(rng, people, owner);
    const first = rng.pick(options);
    const second = rng.pick(options.filter((option) => option.facet !== first.facet));
    const def = build(rng, id, owner.id, candidates.map((person) => person.id), [first, second]);
    if (analyseCase(def, people).length === 0) return def;
  }
  throw new Error("could not generate a valid mini case");
}
