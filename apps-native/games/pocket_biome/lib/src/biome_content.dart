import 'package:biome_rules/biome_rules.dart';

const pocketBiomeSpecies = [
  SpeciesDefinition(
    id: 'moss',
    name: 'Mossling',
    traits: TraitSet(palette: 'fern', pattern: 'soft', affinity: 'shade'),
    growthDuration: Duration(seconds: 10),
    behavior: 'spreads',
  ),
  SpeciesDefinition(
    id: 'sunbud',
    name: 'Sunbud',
    traits: TraitSet(palette: 'gold', pattern: 'ray', affinity: 'light'),
    growthDuration: Duration(seconds: 12),
    behavior: 'turns',
  ),
  SpeciesDefinition(
    id: 'tidebell',
    name: 'Tidebell',
    traits: TraitSet(palette: 'blue', pattern: 'bell', affinity: 'water'),
    growthDuration: Duration(seconds: 14),
    behavior: 'listens',
  ),
  SpeciesDefinition(
    id: 'emberfern',
    name: 'Emberfern',
    traits: TraitSet(palette: 'orange', pattern: 'frond', affinity: 'warmth'),
    growthDuration: Duration(seconds: 16),
    behavior: 'glows',
  ),
  SpeciesDefinition(
    id: 'dewcap',
    name: 'Dewcap',
    traits: TraitSet(palette: 'teal', pattern: 'cap', affinity: 'mist'),
    growthDuration: Duration(seconds: 18),
    behavior: 'drips',
  ),
  SpeciesDefinition(
    id: 'glowvine',
    name: 'Glowvine',
    traits: TraitSet(palette: 'violet', pattern: 'vine', affinity: 'twilight'),
    growthDuration: Duration(seconds: 20),
    behavior: 'climbs',
  ),
];

String speciesName(Iterable<SpeciesDefinition> species, String id) {
  for (final definition in species) {
    if (definition.id == id) return definition.name;
  }
  return id;
}
