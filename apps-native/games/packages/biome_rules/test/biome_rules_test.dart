import 'package:biome_rules/biome_rules.dart';
import 'package:test/test.dart';

final species = [
  const SpeciesDefinition(
    id: 'moss',
    name: 'Mossling',
    traits: TraitSet(palette: 'green', pattern: 'soft', affinity: 'shade'),
    growthDuration: Duration(minutes: 10),
    behavior: 'idle',
  ),
  const SpeciesDefinition(
    id: 'sunbud',
    name: 'Sunbud',
    traits: TraitSet(palette: 'gold', pattern: 'star', affinity: 'sun'),
    growthDuration: Duration(minutes: 10),
    behavior: 'stretch',
  ),
  const SpeciesDefinition(
    id: 'emberfern',
    name: 'Emberfern',
    traits: TraitSet(palette: 'red', pattern: 'frond', affinity: 'warm'),
    growthDuration: Duration(minutes: 10),
    behavior: 'spark',
  ),
  const SpeciesDefinition(
    id: 'tidebell',
    name: 'Tidebell',
    traits: TraitSet(palette: 'blue', pattern: 'bell', affinity: 'water'),
    growthDuration: Duration(minutes: 10),
    behavior: 'sway',
  ),
  const SpeciesDefinition(
    id: 'dewcap',
    name: 'Dewcap',
    traits: TraitSet(palette: 'blue', pattern: 'cap', affinity: 'shade'),
    growthDuration: Duration(minutes: 10),
    behavior: 'drip',
  ),
  const SpeciesDefinition(
    id: 'glowvine',
    name: 'Glowvine',
    traits: TraitSet(palette: 'violet', pattern: 'vine', affinity: 'night'),
    growthDuration: Duration(minutes: 10),
    behavior: 'glow',
  ),
];

void main() {
  final rules = BiomeRules(species);
  final start = DateTime.utc(2026, 1, 1);

  test('elapsed growth settles once and harvest is safe to repeat', () {
    final planted = rules.plant(
      state: BiomeState.empty(),
      slotIndex: 0,
      speciesId: 'moss',
      specimenId: 'specimen-1',
      claimId: 'claim-1',
      now: start,
    );
    final beforeReady = rules.harvest(
      state: planted.state,
      slotIndex: 0,
      now: start.add(const Duration(minutes: 9)),
    );
    final first = rules.harvest(
      state: beforeReady.state,
      slotIndex: 0,
      now: start.add(const Duration(minutes: 10)),
    );
    final retry = rules.harvest(
      state: first.state,
      slotIndex: 0,
      now: start.add(const Duration(minutes: 11)),
    );

    expect(planted.accepted, isTrue);
    expect(beforeReady.reason, 'not_ready');
    expect(first.accepted, isTrue);
    expect(first.state.compost, 2);
    expect(retry.accepted, isFalse);
    expect(retry.reason, 'already_harvested');
    expect(retry.state.compost, first.state.compost);
  });

  test('backward device clock never loses a ready specimen', () {
    final planted = rules.plant(
      state: BiomeState.empty(),
      slotIndex: 1,
      speciesId: 'moss',
      specimenId: 'specimen-2',
      claimId: 'claim-2',
      now: start,
    );
    final ready = rules.settle(
      planted.state,
      start.add(const Duration(minutes: 10)),
    );
    final skewed = rules.settle(ready, start.add(const Duration(minutes: 1)));

    expect(skewed.slots[1], isNotNull);
    expect(skewed.lastTrustedAt, ready.lastTrustedAt);
    expect(skewed.lastClockSkewAt, start.add(const Duration(minutes: 1)));
  });

  test('breeding keeps parents and consumes one claim once', () {
    final state = BiomeState(
      slots: const [null, null, null, null, null, null],
      album: const ['moss', 'sunbud'],
      compost: 2,
      lastTrustedAt: start,
      lastClockSkewAt: null,
    );
    final bred = rules.breed(
      state: state,
      parentSpeciesA: 'moss',
      parentSpeciesB: 'sunbud',
      claimId: 'breed-1',
      now: start,
    );
    final retry = rules.breed(
      state: bred.state,
      parentSpeciesA: 'moss',
      parentSpeciesB: 'sunbud',
      claimId: 'breed-1',
      now: start,
    );

    expect(bred.accepted, isTrue);
    expect(bred.state.album, contains('emberfern'));
    expect(bred.state.album, containsAll(['moss', 'sunbud']));
    expect(bred.state.compost, 0);
    expect(retry.reason, 'duplicate_claim');
    expect(retry.state.compost, 0);
  });

  test('breeding requires owned parent species', () {
    final result = rules.breed(
      state: BiomeState(
        slots: const [null, null, null, null, null, null],
        album: const ['moss'],
        compost: 2,
        lastTrustedAt: start,
        lastClockSkewAt: null,
      ),
      parentSpeciesA: 'moss',
      parentSpeciesB: 'sunbud',
      claimId: 'breed-unowned',
      now: start,
    );

    expect(result.accepted, isFalse);
    expect(result.reason, 'parents_unavailable');
    expect(result.state.compost, 2);
  });

  test('plant claims and specimen IDs cannot be reused', () {
    final first = rules.plant(
      state: BiomeState.empty(),
      slotIndex: 0,
      speciesId: 'moss',
      specimenId: 'specimen-1',
      claimId: 'claim-1',
      now: start,
    );
    final duplicate = rules.plant(
      state: first.state,
      slotIndex: 1,
      speciesId: 'moss',
      specimenId: 'specimen-2',
      claimId: 'claim-1',
      now: start,
    );

    expect(first.accepted, isTrue);
    expect(duplicate.accepted, isFalse);
    expect(duplicate.reason, 'duplicate_claim');
  });
}
