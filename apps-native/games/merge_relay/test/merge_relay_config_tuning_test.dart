import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_config_tuning.dart';
import 'package:merge_relay/src/merge_relay_features.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';
import 'package:merge_relay/src/merge_relay_relay_controller.dart';
import 'package:merge_relay/src/merge_relay_relay_persistence.dart';
import 'package:merge_relay/src/platform/merge_relay_play_games.dart';
import 'package:merge_relay/src/telemetry/merge_relay_event_outbox.dart';
import 'package:merge_relay/src/telemetry/merge_relay_outbox_store.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_fake_gateway.dart';

MergeRelayConfigRevision _revision(
  int revision, {
  int four = 10,
  bool active = true,
  bool daily = true,
  bool endless = true,
  bool relay = true,
}) => MergeRelayConfigRevision(
  revision: revision,
  rulesVersion: mergeRuleVersion,
  contentRevision: 'test',
  spawnWeights: MergeSpawnWeights(
    spawnTwoWeight: 100 - four,
    spawnFourWeight: four,
  ),
  features: MergeRelayFeatureFlags(
    daily: daily,
    endless: endless,
    rankedRelay: relay,
    rewardedAds: false,
    cosmetics: false,
  ),
  active: active,
  createdAt: DateTime.utc(2026),
);

({
  MergeRelayGame game,
  FakeRelayGateway gateway,
  MemoryMergeRelayOutboxStore store,
})
_build({bool social = true}) {
  final gateway = FakeRelayGateway();
  final context = runtimeAppContext(identity: mergeRelayIdentity);
  final store = MemoryMergeRelayOutboxStore();
  final relay = MergeRelayRelayController(
    context: context,
    gateway: gateway,
    authStore: MemoryMergeRelayAuthStore(),
    stateStore: MemoryMergeRelayRelayStateStore(),
  );
  final game = MergeRelayGame(
    context: context,
    saveStore: MemorySaveStore(),
    relayController: relay,
    playGames: FakeMergeRelayPlayGamesProvider(),
    features: MergeRelayFeatures(socialEnabled: social),
    eventOutbox: MergeRelayEventOutbox(
      gateway: gateway,
      store: store,
      clock: const SystemClock(),
      socialEnabled: social,
    ),
    clock: FixedClock(DateTime.utc(2026, 9, 17, 12)),
  );
  return (game: game, gateway: gateway, store: store);
}

Future<MergeRelayGame> _ready(MergeRelayGame game) async {
  await game.restore();
  game.completeTutorial(skipped: true);
  return game;
}

void main() {
  test('solo gate makes no config call and keeps legacy weights', () async {
    final h = _build(social: false);
    await _ready(h.game);
    await h.game.refreshTuning();
    h.game.startEndless();
    expect(h.gateway.getConfigCalls, 0);
    expect(h.game.rules.config.matches(const MergeRuleConfig.legacy()), isTrue);
    h.game.dispose();
  });

  test('new runs use the active revision, old runs stay frozen', () async {
    final h = _build();
    await _ready(h.game);
    final game = h.game;
    h.gateway.configOverride = _revision(2, four: 30);
    await game.refreshTuning();
    game.startEndless();
    expect(game.rules.config.revision, 2);
    expect(game.rules.config.spawnWeights.spawnFourWeight, 30);

    h.gateway.configOverride = _revision(3, four: 50);
    await game.refreshTuning();
    expect(game.rules.config.revision, 2);
    game.startEndless();
    expect(game.rules.config.revision, 3);
    expect(game.rules.config.spawnWeights.spawnFourWeight, 50);
    game.dispose();
  });

  test('rescue content keeps its authored rules', () async {
    final h = _build();
    await _ready(h.game);
    h.gateway.configOverride = _revision(2, four: 30);
    await h.game.refreshTuning();
    h.game.startRescue();
    expect(h.game.rules.config.matches(h.game.content.ruleConfig), isTrue);
    h.game.dispose();
  });

  test('rollback applies the restored revision to the next new run', () async {
    final h = _build();
    await _ready(h.game);
    final game = h.game;
    h.gateway.configOverride = _revision(2, four: 30);
    await game.refreshTuning();
    game.startEndless();
    h.gateway.configOverride = _revision(1);
    await game.refreshTuning();
    expect(game.rules.config.revision, 2);
    game.startEndless();
    expect(game.rules.config.revision, 1);
    expect(game.rules.config.spawnWeights.spawnFourWeight, 10);
    game.dispose();
  });

  test('failed refresh keeps the last known revision', () async {
    final h = _build();
    await _ready(h.game);
    h.gateway.configOverride = _revision(2, four: 30);
    await h.game.refreshTuning();
    h.gateway.configError = const MergeRelayProtocolException('down');
    await h.game.refreshTuning();
    h.game.startEndless();
    expect(h.game.rules.config.revision, 2);
    h.game.dispose();
  });

  test('kill switch restores legacy rules and disables relay', () async {
    final h = _build();
    await _ready(h.game);
    final game = h.game;
    h.gateway.configOverride = _revision(2, four: 30);
    await game.refreshTuning();
    h.gateway.configOverride = _revision(3, four: 30, active: false);
    await game.refreshTuning();
    expect(game.tuning.killed, isTrue);
    game.startEndless();
    expect(game.rules.config.matches(const MergeRuleConfig.legacy()), isTrue);
    game.createRelayFromCurrentBoard();
    await Future<void>.delayed(Duration.zero);
    expect(h.gateway.createRequests, isEmpty);
    game.dispose();
  });

  test('feature flags pause new daily and endless runs', () async {
    final h = _build();
    await _ready(h.game);
    final game = h.game;
    h.gateway.configOverride = _revision(2, daily: false, endless: false);
    await game.refreshTuning();
    game.startRescue();
    game.startDaily();
    expect(game.mode.value, MergeRelayMode.rescue);
    game.startEndless();
    expect(game.mode.value, MergeRelayMode.rescue);
    game.dispose();
  });

  test('relay creation uses the active revision weights', () async {
    final h = _build();
    await _ready(h.game);
    final game = h.game;
    h.gateway.configOverride = _revision(2, four: 30);
    await game.refreshTuning();
    game.createRelayFromCurrentBoard();
    await Future<void>.delayed(const Duration(milliseconds: 50));
    expect(h.gateway.createRequests, isNotEmpty);
    for (final request in h.gateway.createRequests) {
      expect(request.checkpoint.spawnWeights?.spawnFourWeight, 30);
      expect(
        request.idempotencyKey,
        h.gateway.createRequests.first.idempotencyKey,
      );
    }
    game.dispose();
  });

  test('kill switch from config purges and stops game telemetry', () async {
    final h = _build();
    await _ready(h.game);
    h.gateway.configOverride = _revision(2, active: false);
    await h.game.refreshTuning();
    expect(h.game.eventOutbox!.enabled, isFalse);
    h.game.dispose();
  });

  test('frozen daily and challenge hashes ignore later revisions', () {
    final tuning = MergeRelayTuning.fromRevision(_revision(5, four: 50));
    final frozen = MergeSpawnWeights(spawnTwoWeight: 70, spawnFourWeight: 30);
    final config = tuning.dailyConfig(frozen);
    expect(config.spawnWeights.matches(frozen), isTrue);
    expect(tuning.dailyConfig(null).revision, 1);
    final checkpoint = MergeCheckpoint.fromState(
      MergeGameState.newGame(seed: 7),
      maxLegalMoves: 3,
      spawnWeights: frozen,
    );
    String hash(int revision) => mergeChallengePayloadHash(
      checkpoint: checkpoint,
      configRevision: revision,
      mode: MergeRelayMode.rescue,
      originMode: MergeRelayMode.endless,
    );
    expect(hash(2), hash(2));
    expect(hash(2), isNot(hash(5)));
  });
}
