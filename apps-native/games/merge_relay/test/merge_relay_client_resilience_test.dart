import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_app.dart';
import 'package:merge_relay/src/merge_relay_models.dart';
import 'package:merge_relay/src/platform/merge_relay_play_games.dart';
import 'package:merge_rules/merge_rules.dart';
import 'package:platform_core/platform_core.dart';

void main() {
  test('actions stay gated until the first restore completes', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = _DeferredSaveStore();
    final game = MergeRelayGame(
      context: context,
      saveStore: store,
      playGames: _PlayGamesProbe(),
    );

    final restore = game.restore();
    game.openPlay(requestedMode: MergeRelayMode.rescue);
    game.move(MergeDirection.left);
    game.selectTheme('ember');
    expect(game.route.value, MergeRelayRoute.home);
    expect(game.state.value.moveCount, 3);
    expect(game.preferences.value.themeId, 'signal');

    store.readCompleter.complete();
    await restore;
    game.openPlay(requestedMode: MergeRelayMode.rescue);
    expect(game.route.value, MergeRelayRoute.tutorial);
    game.dispose();
  });

  test('a captured write completes after game disposal', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = _BlockingSaveStore();
    final game = MergeRelayGame(
      context: context,
      saveStore: store,
      playGames: _PlayGamesProbe(),
    );
    await game.restore();
    game.startEndless();
    await store.writeStarted.future;

    game.dispose();
    store.release.complete();
    await game.flushWrites();

    expect(store.writes, hasLength(1));
    final sessions = store.writes.single.payload['sessions'] as Map;
    expect(sessions['endless'], isA<Map>());
  });

  test('lifecycle pause and system back leave the board safely', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final game = MergeRelayGame(
      context: context,
      saveStore: MemorySaveStore(),
      playGames: _PlayGamesProbe(),
    );
    await game.restore();
    game.startEndless();

    game.handleLifecycleState(AppLifecycleState.paused);
    expect(game.isPaused.value, isTrue);
    game.setPaused(false);
    expect(game.handleSystemBack(), isTrue);
    expect(game.route.value, MergeRelayRoute.play);
    expect(game.isPaused.value, isTrue);
    expect(game.handleSystemBack(), isTrue);
    expect(game.route.value, MergeRelayRoute.home);
    game.dispose();
  });

  test('selected rescue survives the hands-on guide', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final game = MergeRelayGame(
      context: context,
      saveStore: MemorySaveStore(),
      playGames: _PlayGamesProbe(),
    );
    await game.restore();
    game.openRescue(index: 1);
    expect(game.route.value, MergeRelayRoute.tutorial);

    game.completeTutorial(skipped: false);
    expect(game.mode.value, MergeRelayMode.rescue);
    expect(game.rescueId.value, game.content.rescues[1].id);
    game.dispose();
  });

  test(
    'Play Games initialization stays guest-first without a relay client',
    () async {
      final context = runtimeAppContext(identity: mergeRelayIdentity);
      final probe = _PlayGamesProbe();
      final game = MergeRelayGame(
        context: context,
        saveStore: MemorySaveStore(),
        playGames: probe,
      );
      await game.restore();
      await Future<void>.delayed(Duration.zero);
      expect(probe.initializations, 1);

      game.completeTutorial(skipped: true);
      await game.signInToPlayGames();
      expect(probe.signIns, 0);
      game.dispose();
    },
  );

  test('server access rejects a granted response without an auth code', () {
    final empty = MergeRelayPlayGamesServerAccess.fromPlatform({
      'granted': true,
      'server_auth_code': ' ',
    });
    expect(empty.granted, isFalse);
    expect(empty.authCode, isNull);
    expect(empty.diagnosticCode, 'invalid_server_auth_code');

    final valid = MergeRelayPlayGamesServerAccess.fromPlatform({
      'granted': true,
      'server_auth_code': 'code-123',
    });
    expect(valid.granted, isTrue);
    expect(valid.authCode, 'code-123');
  });

  test('restore failure protects the saved board from new writes', () async {
    final context = runtimeAppContext(identity: mergeRelayIdentity);
    final store = _FailingReadStore();
    final game = MergeRelayGame(context: context, saveStore: store);

    await game.restore();
    expect(game.restoreFailed.value, isTrue);
    game.startEndless();
    await game.flushWrites();
    expect(store.writes, isEmpty);

    store.failReads = false;
    await game.retryRestore();
    expect(game.restoreFailed.value, isFalse);
    game.startEndless();
    await game.flushWrites();
    expect(store.writes, hasLength(1));
    game.dispose();
  });
}

final class _DeferredSaveStore implements SaveStore {
  final readCompleter = Completer<SaveEnvelope?>();

  @override
  Future<SaveEnvelope?> read(AppContext context) => readCompleter.future;

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {}

  @override
  Future<void> delete(AppContext context) async {}
}

final class _BlockingSaveStore implements SaveStore {
  final writes = <SaveEnvelope>[];
  final writeStarted = Completer<void>();
  final release = Completer<void>();

  @override
  Future<SaveEnvelope?> read(AppContext context) async => null;

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    if (!writeStarted.isCompleted) writeStarted.complete();
    await release.future;
    writes.add(envelope);
  }

  @override
  Future<void> delete(AppContext context) async {}
}

final class _FailingReadStore implements SaveStore {
  var failReads = true;
  final writes = <SaveEnvelope>[];

  @override
  Future<SaveEnvelope?> read(AppContext context) async {
    if (failReads) throw const FormatException('corrupt save');
    return null;
  }

  @override
  Future<void> write(AppContext context, SaveEnvelope envelope) async {
    writes.add(envelope);
  }

  @override
  Future<void> delete(AppContext context) async {}
}

final class _PlayGamesProbe implements MergeRelayPlayGamesProvider {
  int initializations = 0;
  int signIns = 0;

  @override
  Future<MergeRelayPlayGamesState> initialize() async {
    initializations += 1;
    return const MergeRelayPlayGamesState(
      status: MergeRelayPlayGamesStatus.signedOut,
    );
  }

  @override
  Future<MergeRelayPlayGamesState> signIn() async {
    signIns += 1;
    return const MergeRelayPlayGamesState(
      status: MergeRelayPlayGamesStatus.signedOut,
    );
  }

  @override
  Future<MergeRelayPlayGamesServerAccess> requestServerAccess() async =>
      const MergeRelayPlayGamesServerAccess(granted: false);

  @override
  Future<MergeRelayPlayGamesActionResult> showAchievements() async =>
      const MergeRelayPlayGamesActionResult(
        status: MergeRelayPlayGamesActionStatus.unavailable,
      );

  @override
  Future<MergeRelayPlayGamesActionResult> showLeaderboards() async =>
      const MergeRelayPlayGamesActionResult(
        status: MergeRelayPlayGamesActionStatus.unavailable,
      );
}
