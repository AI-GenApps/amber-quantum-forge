import { CASES, isClosed, type Profile } from "@web-games/lost-parcel-desk-core";

/** Townsfolk the player has met: candidates of closed cases and of the case in progress. */
export function metPeople(profile: Profile, activeCandidates: readonly string[] = []): Set<string> {
  const met = new Set<string>(activeCandidates);
  for (const item of CASES) {
    if (isClosed(profile, item.id)) for (const id of item.candidateIds) met.add(id);
  }
  for (const id of profile.session?.state.candidateIds ?? []) met.add(id);
  return met;
}
