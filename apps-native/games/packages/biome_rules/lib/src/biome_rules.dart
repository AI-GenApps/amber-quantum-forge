import 'biome_models.dart';

final class BiomeRules {
  BiomeRules(Iterable<SpeciesDefinition> species)
    : speciesById = {for (final item in species) item.id: item} {
    if (speciesById.isEmpty)
      throw ArgumentError('At least one species is required');
    if (speciesById.length != species.length) {
      throw ArgumentError('Species IDs must be unique');
    }
    for (final definition in speciesById.values) definition.validate();
  }

  final Map<String, SpeciesDefinition> speciesById;

  BiomeState settle(BiomeState state, DateTime now) {
    final current = now.toUtc();
    final trusted = state.lastTrustedAt;
    if (trusted != null && current.isBefore(trusted)) {
      if (state.lastClockSkewAt != null) return state;
      return state.copyWith(lastClockSkewAt: current);
    }
    if (trusted == current) return state;
    return state.copyWith(lastTrustedAt: current, clearClockSkew: true);
  }

  BiomeOperation plant({
    required BiomeState state,
    required int slotIndex,
    required String speciesId,
    required String specimenId,
    required String claimId,
    required DateTime now,
  }) {
    final settled = settle(state, now);
    if (!_validSlot(slotIndex))
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: 'invalid_slot',
      );
    if (settled.slots[slotIndex] != null) {
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: 'slot_occupied',
      );
    }
    final species = speciesById[speciesId];
    if (species == null ||
        specimenId.isEmpty ||
        claimId.isEmpty ||
        settled.completedClaims.contains(claimId) ||
        settled.slots.any(
          (slot) => slot?.specimenId == specimenId || slot?.claimId == claimId,
        )) {
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: settled.completedClaims.contains(claimId)
            ? 'duplicate_claim'
            : 'invalid_species_or_id',
      );
    }
    final start = settled.lastTrustedAt ?? now.toUtc();
    final slot = BiomeSlot(
      specimenId: specimenId,
      speciesId: speciesId,
      claimId: claimId,
      plantedAt: start,
      readyAt: start.add(species.growthDuration),
    );
    final slots = [...settled.slots]..[slotIndex] = slot;
    return BiomeOperation(
      state: settled.copyWith(
        slots: slots,
        completedClaims: {...settled.completedClaims, claimId},
      ),
      accepted: true,
      reason: 'planted',
    );
  }

  BiomeOperation harvest({
    required BiomeState state,
    required int slotIndex,
    required DateTime now,
  }) {
    final settled = settle(state, now);
    if (!_validSlot(slotIndex))
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: 'invalid_slot',
      );
    final slot = settled.slots[slotIndex];
    if (slot == null)
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: 'already_harvested',
      );
    final trustedNow = settled.lastTrustedAt ?? now.toUtc();
    if (!slot.isReadyAt(trustedNow)) {
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: 'not_ready',
      );
    }
    final slots = [...settled.slots]..[slotIndex] = null;
    final album = {...settled.album, slot.speciesId};
    return BiomeOperation(
      state: settled.copyWith(
        slots: slots,
        album: album,
        compost: settled.compost + 2,
      ),
      accepted: true,
      reason: 'harvested',
    );
  }

  BiomeOperation breed({
    required BiomeState state,
    required String parentSpeciesA,
    required String parentSpeciesB,
    required String claimId,
    required DateTime now,
  }) {
    final settled = settle(state, now);
    if (claimId.isEmpty || settled.completedClaims.contains(claimId)) {
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: 'duplicate_claim',
      );
    }
    if (!speciesById.containsKey(parentSpeciesA) ||
        !speciesById.containsKey(parentSpeciesB) ||
        !settled.album.contains(parentSpeciesA) ||
        !settled.album.contains(parentSpeciesB)) {
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: 'parents_unavailable',
      );
    }
    if (settled.compost < 2) {
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: 'insufficient_compost',
      );
    }
    final output = _recipes[_recipeKey(parentSpeciesA, parentSpeciesB)];
    if (output == null || !speciesById.containsKey(output)) {
      return BiomeOperation(
        state: settled,
        accepted: false,
        reason: 'recipe_unavailable',
      );
    }
    return BiomeOperation(
      state: settled.copyWith(
        album: {...settled.album, output},
        compost: settled.compost - 2,
        completedClaims: {...settled.completedClaims, claimId},
      ),
      accepted: true,
      reason: 'bred',
    );
  }

  bool _validSlot(int index) => index >= 0 && index < 6;

  static String _recipeKey(String first, String second) {
    final pair = [first, second]..sort();
    return pair.join('|');
  }

  static const _recipes = <String, String>{
    'moss|sunbud': 'emberfern',
    'moss|tidebell': 'dewcap',
    'emberfern|sunbud': 'glowvine',
  };
}
