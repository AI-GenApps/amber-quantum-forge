import type { Person } from "../../src/types";

function person(
  id: string,
  name: string,
  trade: string,
  street: string,
  pastime: string,
  look: string,
  pet: string,
): Person {
  return { id, name, trade, facets: { street, pastime, look, pet } };
}

export const MINI_CAST: Person[] = [
  person("p1", "Ada", "baker", "Quay Road", "angling", "red hair", "cat"),
  person("p2", "Ben", "barber", "Quay Road", "choir", "spectacles", "dog"),
  person("p3", "Cleo", "tailor", "Mill Lane", "angling", "spectacles", "canary"),
  person("p4", "Dev", "signaller", "Mill Lane", "chess", "red hair", "dog"),
  person("p5", "Esme", "teacher", "Tanner's Row", "chess", "tall", "cat"),
  person("p6", "Finn", "mechanic", "Tanner's Row", "choir", "tall", "canary"),
];

export function generateCast(rng: {
  shuffle<T>(items: readonly T[]): T[];
}): Person[] {
  const ids = Array.from({ length: 12 }, (_, index) => index);
  const facets = ["street", "pastime", "look", "pet"] as const;
  const values: Record<(typeof facets)[number], string[]> = {
    street: [],
    pastime: [],
    look: [],
    pet: [],
  };
  for (const facet of facets) {
    const order = rng.shuffle(ids);
    const byPerson: string[] = [];
    order.forEach((personIndex, slot) => {
      byPerson[personIndex] = `${facet}-${Math.floor(slot / 2)}`;
    });
    values[facet] = byPerson;
  }
  return ids.map((index) => ({
    id: `g${index}`,
    name: `Person ${index}`,
    trade: "trade",
    facets: {
      street: values.street[index] as string,
      pastime: values.pastime[index] as string,
      look: values.look[index] as string,
      pet: values.pet[index] as string,
    },
  }));
}
