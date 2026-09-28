/// Offline XP queue (task 26e): when an `xp/claim` call can't reach the
/// server (no network), the pending XP delta is persisted locally through
/// the same `platform_core` [SaveStore]/[SaveEnvelope] mechanism task 11's
/// `ludo_local_save.dart` uses, under its own [AppIdentity] sub-namespace
/// so this save never collides with the local-match-resume or
/// profile/settings saves.
///
/// Multiple queued deltas coalesce into one persisted entry (summed
/// `xp_delta`/`elapsed_ms`/`matches_completed`, same `claim_id` reused
/// across the batch) rather than being replayed individually — avoids
/// spamming the daily-cap check with many tiny requests, per the task's
/// Context/Decisions. [flush] retries the coalesced batch on the next
/// successful gateway call and only clears the queue once the server
/// actually accepts (or idempotently replays) the claim.
library;

import 'package:platform_core/platform_core.dart';

import 'ludo_profile_settings.dart' show ludoDefaultSaveStore;

/// Schema version for [LudoPendingXpDelta.toJson]/`fromJson`.
const ludoOfflineXpQueueSchemaVersion = 1;

/// Per-match XP for a win, mirroring `economy-config.ts`'s
/// `xp.matchWinXp` (`.agents/games/ludo-vortex/economy.md`'s 100/40
/// table) — the server re-derives and caps this independently
/// (`wallet-routes.ts`'s plausibility check), so a client-side drift here
/// only risks a claim being rejected as implausible, never an over-grant.
const ludoMatchWinXp = 100;

/// Per-match XP for a loss, mirroring `economy-config.ts`'s
/// `xp.matchLossXp`.
const ludoMatchLossXp = 40;

final ludoOfflineXpQueueIdentity = AppIdentity(
  stableId: 'ludo_offline_xp_queue',
  canonicalName: 'Ludo Offline XP Queue',
  publicTitle: 'Ludo Offline XP Queue',
  subtitle: 'Ludo Offline XP Queue',
);

/// A pending, not-yet-confirmed XP claim: the coalesced sum of one or more
/// local match results, plus the `claim_id` the whole batch is submitted
/// under (stable across retries of the same batch, so a retry after a
/// partial failure never risks being credited twice).
final class LudoPendingXpDelta {
  const LudoPendingXpDelta({
    required this.claimId,
    required this.xpDelta,
    required this.elapsedMs,
    required this.matchesCompleted,
  });

  final String claimId;
  final int xpDelta;
  final int elapsedMs;
  final int matchesCompleted;

  LudoPendingXpDelta coalesceWith({
    required int xpDelta,
    required int elapsedMs,
    required int matchesCompleted,
  }) => LudoPendingXpDelta(
    claimId: claimId,
    xpDelta: this.xpDelta + xpDelta,
    elapsedMs: this.elapsedMs + elapsedMs,
    matchesCompleted: this.matchesCompleted + matchesCompleted,
  );

  Map<String, Object?> toJson() => {
    'claim_id': claimId,
    'xp_delta': xpDelta,
    'elapsed_ms': elapsedMs,
    'matches_completed': matchesCompleted,
  };

  static LudoPendingXpDelta fromJson(Map<String, Object?> json) {
    final claimId = json['claim_id'];
    final xpDelta = json['xp_delta'];
    final elapsedMs = json['elapsed_ms'];
    final matchesCompleted = json['matches_completed'];
    if (claimId is! String ||
        xpDelta is! int ||
        elapsedMs is! int ||
        matchesCompleted is! int) {
      throw const FormatException('Invalid offline XP queue save');
    }
    return LudoPendingXpDelta(
      claimId: claimId,
      xpDelta: xpDelta,
      elapsedMs: elapsedMs,
      matchesCompleted: matchesCompleted,
    );
  }
}

int _claimIdCounter = 0;

/// A fresh, unique idempotency key for a new queued batch, matching
/// `ludo_online_controller.dart`'s `_newIdempotencyKey` pattern.
String ludoNewOfflineXpClaimId() {
  _claimIdCounter += 1;
  return 'offline_xp-${DateTime.now().microsecondsSinceEpoch}-$_claimIdCounter';
}

/// Persists, coalesces and retries a single pending XP-claim batch. Only
/// one batch is ever queued at a time — a new delta coalesces onto
/// whatever is already queued rather than creating a second entry.
class LudoOfflineXpQueue {
  LudoOfflineXpQueue({required this.saveStore, required this.appContext});

  final SaveStore saveStore;
  final AppContext appContext;

  static Future<LudoOfflineXpQueue> production() async {
    final store = await ludoDefaultSaveStore();
    return LudoOfflineXpQueue(
      saveStore: store,
      appContext: runtimeAppContext(identity: ludoOfflineXpQueueIdentity),
    );
  }

  /// Loads the queued batch, or `null` if nothing is queued or the saved
  /// envelope fails validation/decoding (treated as nothing queued, same
  /// as `ludo_local_save.dart`'s precedent — a corrupt queue never
  /// crashes the app, it just loses that one offline session's XP).
  Future<LudoPendingXpDelta?> load() async {
    SaveEnvelope? envelope;
    try {
      envelope = await saveStore.read(appContext);
    } on SaveValidationException {
      envelope = null;
    }
    if (envelope == null) return null;
    try {
      return LudoPendingXpDelta.fromJson(envelope.payload);
    } on FormatException {
      return null;
    }
  }

  /// Queues (coalescing onto any already-queued batch) a new local match
  /// result's XP delta.
  Future<void> enqueue({
    required int xpDelta,
    required int elapsedMs,
    required int matchesCompleted,
    DateTime Function() now = DateTime.now,
  }) async {
    final existing = await load();
    final merged =
        existing?.coalesceWith(
          xpDelta: xpDelta,
          elapsedMs: elapsedMs,
          matchesCompleted: matchesCompleted,
        ) ??
        LudoPendingXpDelta(
          claimId: ludoNewOfflineXpClaimId(),
          xpDelta: xpDelta,
          elapsedMs: elapsedMs,
          matchesCompleted: matchesCompleted,
        );
    await saveStore.write(
      appContext,
      SaveEnvelope.create(
        context: appContext,
        schemaVersion: ludoOfflineXpQueueSchemaVersion,
        savedAt: now(),
        payload: merged.toJson(),
      ),
    );
  }

  /// Clears the queue (e.g. once a batch is confirmed applied). A no-op if
  /// nothing was queued.
  Future<void> clear() async {
    await saveStore.delete(appContext);
  }

  /// Attempts to submit the queued batch (if any) through [claim] — a
  /// caller-supplied gateway call, so this file has no direct dependency
  /// on [LudoGateway]/[LudoAuthController]. On success, clears the queue
  /// and returns the result. On failure (still offline), the queue is left
  /// untouched for the next retry and `null` is returned.
  Future<T?> flush<T>({
    required Future<T> Function(LudoPendingXpDelta pending) claim,
  }) async {
    final pending = await load();
    if (pending == null) return null;
    try {
      final result = await claim(pending);
      await clear();
      return result;
    } on Object {
      return null;
    }
  }
}
