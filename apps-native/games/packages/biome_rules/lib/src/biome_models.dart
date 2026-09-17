import 'package:platform_core/platform_core.dart';

const biomeRuleVersion = 'PB-2D-1';
const maxBiomeCompost = 1000000;
const maxBiomeEntries = 1000;
const maxBiomeIdentifierLength = 64;

final class TraitSet {
  const TraitSet({
    required this.palette,
    required this.pattern,
    required this.affinity,
  });

  final String palette;
  final String pattern;
  final String affinity;

  JsonObject toJson() => {
    'palette': palette,
    'pattern': pattern,
    'affinity': affinity,
  };

  void validate() {
    _validateIdentifier(palette, 'palette');
    _validateIdentifier(pattern, 'pattern');
    _validateIdentifier(affinity, 'affinity');
  }
}

final class SpeciesDefinition {
  const SpeciesDefinition({
    required this.id,
    required this.name,
    required this.traits,
    required this.growthDuration,
    required this.behavior,
  });

  final String id;
  final String name;
  final TraitSet traits;
  final Duration growthDuration;
  final String behavior;

  void validate() {
    _validateIdentifier(id, 'species id');
    _validateIdentifier(name, 'species name');
    _validateIdentifier(behavior, 'species behavior');
    traits.validate();
    if (growthDuration <= Duration.zero ||
        growthDuration > const Duration(days: 30)) {
      throw ArgumentError.value(growthDuration, 'growthDuration');
    }
  }
}

final class BiomeSlot {
  const BiomeSlot({
    required this.specimenId,
    required this.speciesId,
    required this.claimId,
    required this.plantedAt,
    required this.readyAt,
  });

  final String specimenId;
  final String speciesId;
  final String claimId;
  final DateTime plantedAt;
  final DateTime readyAt;

  bool isReadyAt(DateTime now) => !now.isBefore(readyAt);

  JsonObject toJson() => {
    'specimen_id': specimenId,
    'species_id': speciesId,
    'claim_id': claimId,
    'planted_at': epochMilliseconds(plantedAt),
    'ready_at': epochMilliseconds(readyAt),
  };

  void validate() {
    _validateIdentifier(specimenId, 'specimenId');
    _validateIdentifier(speciesId, 'speciesId');
    _validateIdentifier(claimId, 'claimId');
    if (readyAt.isBefore(plantedAt)) {
      throw ArgumentError.value(readyAt, 'readyAt');
    }
  }

  factory BiomeSlot.fromJson(JsonObject json) {
    return BiomeSlot(
      specimenId: _requiredString(json['specimen_id'], 'specimen_id'),
      speciesId: _requiredString(json['species_id'], 'species_id'),
      claimId: _requiredString(json['claim_id'], 'claim_id'),
      plantedAt: dateTimeFromEpochMilliseconds(
        _requiredInt(json['planted_at'], 'planted_at'),
      ),
      readyAt: dateTimeFromEpochMilliseconds(
        _requiredInt(json['ready_at'], 'ready_at'),
      ),
    );
  }
}

final class BiomeState {
  BiomeState({
    required Iterable<BiomeSlot?> slots,
    required Iterable<String> album,
    required this.compost,
    required this.lastTrustedAt,
    required this.lastClockSkewAt,
    this.ruleVersion = biomeRuleVersion,
    Iterable<String> completedClaims = const [],
  }) : slots = List.unmodifiable(slots),
       album = Set.unmodifiable(album),
       completedClaims = Set.unmodifiable(completedClaims) {
    if (this.slots.length != 6) {
      throw ArgumentError.value(
        this.slots.length,
        'slots',
        'A habitat has six slots',
      );
    }
    if (compost < 0 || compost > maxBiomeCompost) {
      throw ArgumentError.value(compost, 'compost');
    }
    if (this.slots.whereType<BiomeSlot>().length > 6 ||
        album.length > maxBiomeEntries ||
        completedClaims.length > maxBiomeEntries) {
      throw ArgumentError('Biome save contains too many entries');
    }
    for (final slot in this.slots.whereType<BiomeSlot>()) slot.validate();
    for (final id in album) _validateIdentifier(id, 'album entry');
    for (final claim in completedClaims) {
      _validateIdentifier(claim, 'completed claim');
    }
    if (ruleVersion != biomeRuleVersion) {
      throw ArgumentError.value(ruleVersion, 'ruleVersion');
    }
  }

  factory BiomeState.empty() {
    return BiomeState(
      slots: List<BiomeSlot?>.filled(6, null),
      album: const {},
      compost: 0,
      lastTrustedAt: null,
      lastClockSkewAt: null,
    );
  }

  factory BiomeState.fromJson(JsonObject json) {
    final rawSlots = json['slots'];
    final rawAlbum = json['album'];
    final rawClaims = json['completed_claims'];
    if (rawSlots is! List ||
        rawAlbum is! List ||
        rawClaims is! List ||
        rawAlbum.any((value) => value is! String) ||
        rawClaims.any((value) => value is! String)) {
      throw const FormatException('Invalid biome save');
    }
    return BiomeState(
      slots: rawSlots.map((value) {
        if (value == null) return null;
        return BiomeSlot.fromJson(value.cast<String, Object?>());
      }),
      album: rawAlbum.cast<String>(),
      compost: _requiredInt(json['compost'], 'compost'),
      lastTrustedAt: _optionalDate(json['last_trusted_at']),
      lastClockSkewAt: _optionalDate(json['last_clock_skew_at']),
      ruleVersion: _ruleVersion(json['rule_version']),
      completedClaims: rawClaims.cast<String>(),
    );
  }

  final List<BiomeSlot?> slots;
  final Set<String> album;
  final int compost;
  final DateTime? lastTrustedAt;
  final DateTime? lastClockSkewAt;
  final String ruleVersion;
  final Set<String> completedClaims;

  JsonObject toJson() => {
    'slots': slots.map((slot) => slot?.toJson()).toList(growable: false),
    'album': album.toList()..sort(),
    'compost': compost,
    'last_trusted_at': lastTrustedAt == null
        ? null
        : epochMilliseconds(lastTrustedAt!),
    'last_clock_skew_at': lastClockSkewAt == null
        ? null
        : epochMilliseconds(lastClockSkewAt!),
    'rule_version': ruleVersion,
    'completed_claims': completedClaims.toList()..sort(),
  };

  BiomeState copyWith({
    Iterable<BiomeSlot?>? slots,
    Iterable<String>? album,
    int? compost,
    DateTime? lastTrustedAt,
    DateTime? lastClockSkewAt,
    bool clearClockSkew = false,
    Iterable<String>? completedClaims,
  }) {
    return BiomeState(
      slots: slots ?? this.slots,
      album: album ?? this.album,
      compost: compost ?? this.compost,
      lastTrustedAt: lastTrustedAt ?? this.lastTrustedAt,
      lastClockSkewAt: clearClockSkew
          ? null
          : lastClockSkewAt ?? this.lastClockSkewAt,
      ruleVersion: ruleVersion,
      completedClaims: completedClaims ?? this.completedClaims,
    );
  }
}

final class BiomeOperation {
  const BiomeOperation({
    required this.state,
    required this.accepted,
    required this.reason,
  });

  final BiomeState state;
  final bool accepted;
  final String reason;
}

String _requiredString(Object? value, String name) {
  if (value is! String || value.isEmpty) throw FormatException('Missing $name');
  return value;
}

String _ruleVersion(Object? value) {
  if (value == null) return biomeRuleVersion;
  if (value != biomeRuleVersion) {
    throw const FormatException('Unsupported biome rule version');
  }
  return biomeRuleVersion;
}

void _validateIdentifier(String value, String name) {
  if (value.isEmpty || value.length > maxBiomeIdentifierLength) {
    throw ArgumentError.value(value, name);
  }
}

int _requiredInt(Object? value, String name) {
  if (value is! int) throw FormatException('Missing $name');
  return value;
}

DateTime? _optionalDate(Object? value) {
  if (value == null) return null;
  return dateTimeFromEpochMilliseconds(_requiredInt(value, 'date'));
}
