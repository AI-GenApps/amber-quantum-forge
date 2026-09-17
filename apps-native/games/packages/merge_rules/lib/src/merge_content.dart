import 'merge_codec.dart';
import 'merge_models.dart';

final class MergeContentEntry {
  MergeContentEntry({
    required this.id,
    required this.version,
    required this.mode,
    required this.checkpoint,
    this.utcDate,
  }) {
    _validateText(id, 'id', 128);
    _validateText(version, 'version', 64);
    if (mode == MergeRelayMode.daily) {
      if (utcDate == null || !_isUtcDate(utcDate!)) {
        throw const FormatException('Daily Merge content requires a UTC date');
      }
    } else if (utcDate != null) {
      throw const FormatException('Only daily Merge content has a UTC date');
    }
    if (checkpoint.contentId != null && checkpoint.contentId != id) {
      throw const FormatException('Checkpoint content id mismatch');
    }
    if (checkpoint.contentVersion != null &&
        checkpoint.contentVersion != version) {
      throw const FormatException('Checkpoint content version mismatch');
    }
  }

  factory MergeContentEntry.fromJson(Map<String, Object?> json) {
    const fields = {'id', 'version', 'mode', 'checkpoint', 'utc_date'};
    if (json.keys.any((key) => !fields.contains(key))) {
      throw const FormatException('Unexpected Merge content fields');
    }
    final id = json['id'];
    final version = json['version'];
    final mode = json['mode'];
    final checkpoint = json['checkpoint'];
    final utcDate = json['utc_date'];
    if (id is! String ||
        version is! String ||
        mode is! String ||
        checkpoint is! Map ||
        (utcDate != null && utcDate is! String)) {
      throw const FormatException('Invalid Merge content entry');
    }
    return MergeContentEntry(
      id: id,
      version: version,
      mode: _parseMode(mode),
      checkpoint: MergeCheckpoint.fromJson(checkpoint.cast<String, Object?>()),
      utcDate: utcDate as String?,
    );
  }

  final String id;
  final String version;
  final MergeRelayMode mode;
  final MergeCheckpoint checkpoint;
  final String? utcDate;

  Map<String, Object?> toJson() => {
    'id': id,
    'version': version,
    'mode': mode.name,
    'checkpoint': checkpoint.toJson(),
    if (utcDate != null) 'utc_date': utcDate,
  };
}

final class MergeContentCatalog {
  MergeContentCatalog(
    Iterable<MergeContentEntry> entries, {
    this.schemaVersion = 1,
  }) : entries = List.unmodifiable(entries) {
    if (schemaVersion != 1) {
      throw ArgumentError.value(schemaVersion, 'schemaVersion');
    }
    if (this.entries.isEmpty || this.entries.length > 64) {
      throw ArgumentError.value(this.entries.length, 'entries');
    }
    final ids = <String>{};
    final dates = <String>{};
    for (final entry in this.entries) {
      if (!ids.add(entry.id)) {
        throw const FormatException('Duplicate Merge content id');
      }
      if (entry.utcDate != null && !dates.add(entry.utcDate!)) {
        throw const FormatException('Duplicate daily Merge content date');
      }
    }
  }

  factory MergeContentCatalog.fromJson(Map<String, Object?> json) {
    if (json.length != 2 ||
        !json.containsKey('schema_version') ||
        !json.containsKey('entries')) {
      throw const FormatException('Unexpected Merge content catalog fields');
    }
    final schemaVersion = json['schema_version'];
    if (schemaVersion is! int) {
      throw const FormatException('Invalid Merge content catalog version');
    }
    final entries = json['entries'];
    if (entries is! List || entries.any((value) => value is! Map)) {
      throw const FormatException('Invalid Merge content catalog');
    }
    return MergeContentCatalog(
      entries.map(
        (value) =>
            MergeContentEntry.fromJson((value as Map).cast<String, Object?>()),
      ),
      schemaVersion: schemaVersion,
    );
  }

  final int schemaVersion;
  final List<MergeContentEntry> entries;

  Map<String, Object?> toJson() => {
    'schema_version': schemaVersion,
    'entries': entries.map((entry) => entry.toJson()).toList(),
  };

  String get contentHash => sha256Hex(toJson());
}

MergeRelayMode _parseMode(String value) => switch (value) {
  'rescue' => MergeRelayMode.rescue,
  'daily' => MergeRelayMode.daily,
  'endless' => MergeRelayMode.endless,
  _ => throw const FormatException('Unsupported Merge content mode'),
};

void _validateText(String value, String name, int maxLength) {
  if (value.isEmpty ||
      value.length > maxLength ||
      RegExp(r'[\u0000-\u001f]').hasMatch(value)) {
    throw ArgumentError.value(value, name);
  }
}

bool _isUtcDate(String value) {
  if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(value)) return false;
  final date = DateTime.tryParse('${value}T00:00:00Z');
  return date != null && date.toUtc().toIso8601String().startsWith('${value}T');
}
