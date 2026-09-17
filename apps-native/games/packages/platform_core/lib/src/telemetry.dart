import 'app_context.dart';
import 'clock.dart';

final class TelemetryEvent {
  TelemetryEvent({
    required this.name,
    required this.context,
    required this.occurredAt,
    Map<String, Object?> fields = const {},
  }) : fields = sanitizeFields(fields);

  final String name;
  final AppContext context;
  final DateTime occurredAt;
  final Map<String, Object?> fields;

  Map<String, Object?> toJson() {
    return {
      'event': name,
      'occurred_at': occurredAt.toUtc().toIso8601String(),
      'app_id': context.identity.stableId,
      'environment': context.environment.name,
      'app_version': context.appVersion,
      'session_id': context.sessionId,
      'fields': fields,
    };
  }
}

abstract interface class TelemetrySink {
  void record(TelemetryEvent event);
}

final class MemoryTelemetrySink implements TelemetrySink {
  final List<TelemetryEvent> events = [];

  @override
  void record(TelemetryEvent event) {
    events.add(event);
  }
}

final class TelemetryRecorder {
  const TelemetryRecorder({
    required this.context,
    required this.clock,
    required this.sink,
  });

  final AppContext context;
  final Clock clock;
  final TelemetrySink sink;

  void record(String name, {Map<String, Object?> fields = const {}}) {
    if (name.trim().isEmpty) return;
    sink.record(
      TelemetryEvent(
        name: name,
        context: context,
        occurredAt: clock.now(),
        fields: fields,
      ),
    );
  }
}

Map<String, Object?> sanitizeFields(Map<String, Object?> fields) {
  final safe = <String, Object?>{};
  for (final entry in fields.entries) {
    final key = entry.key.toLowerCase();
    if (!_isSafeKey(key)) continue;
    safe[key] = _sanitizeValue(key, entry.value);
  }
  return safe;
}

Object? _sanitizeValue(String key, Object? value) {
  const blocked = {
    'token',
    'access_token',
    'refresh_token',
    'email',
    'raw_photo',
    'rawphoto',
    'photo_bytes',
    'photobytes',
    'caption',
    'free_text',
    'freetext',
    'account_id',
    'accountid',
  };
  if (blocked.contains(key)) return '[redacted]';
  if (value is String) {
    return value.length <= 128 ? value : value.substring(0, 128);
  }
  if (value is num || value is bool || value == null) return value;
  if (value is List) {
    return value
        .take(20)
        .map((item) => _sanitizeValue(key, item))
        .toList(growable: false);
  }
  if (value is Map) {
    final nested = <String, Object?>{};
    for (final entry in value.entries) {
      nested[entry.key.toString()] = entry.value;
    }
    return sanitizeFields(nested);
  }
  final text = value.toString();
  return text.substring(0, text.length.clamp(0, 128));
}

bool _isSafeKey(String key) {
  const allowed = {
    'accepted',
    'action',
    'album_count',
    'caption',
    'details',
    'direction',
    'level_id',
    'loot_collected',
    'move_count',
    'reason',
    'rng_draws',
    'rule_version',
    'score',
    'score_delta',
    'species_id',
    'status',
    'ticks',
    'tool',
  };
  return allowed.contains(key);
}
