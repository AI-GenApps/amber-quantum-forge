import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/audio/merge_relay_audio.dart';
import 'package:merge_relay/src/audio/merge_relay_audio_service.dart';
import 'package:merge_relay/src/merge_relay_models.dart';

/// Records every call instead of touching a real platform audio channel.
/// [failing] makes every method throw, for the "a failing player doesn't
/// throw" requirement — the service must swallow it.
class _FakeAudioPlayer implements MergeRelayAudioPlayer {
  _FakeAudioPlayer({this.failing = false});

  final bool failing;
  final List<String> calls = [];
  bool disposed = false;

  @override
  Future<void> play(
    String assetPath, {
    bool loop = false,
    double playbackRate = 1.0,
  }) async {
    calls.add('play($assetPath, loop: $loop, rate: $playbackRate)');
    if (failing) throw StateError('platform channel unavailable');
  }

  @override
  Future<void> pause() async {
    calls.add('pause()');
    if (failing) throw StateError('platform channel unavailable');
  }

  @override
  Future<void> resume() async {
    calls.add('resume()');
    if (failing) throw StateError('platform channel unavailable');
  }

  @override
  Future<void> stop() async {
    calls.add('stop()');
    if (failing) throw StateError('platform channel unavailable');
  }

  @override
  Future<void> dispose() async {
    disposed = true;
    calls.add('dispose()');
    if (failing) throw StateError('platform channel unavailable');
  }
}

MergeRelayAudioService _service(
  ValueNotifier<MergeRelayPreferences> preferences,
  List<_FakeAudioPlayer> players, {
  bool failing = false,
}) {
  return MergeRelayAudioService(
    preferences: preferences,
    playerFactory: () {
      final player = _FakeAudioPlayer(failing: failing);
      players.add(player);
      return player;
    },
  );
}

void main() {
  group('MergeRelayAudioService.play', () {
    test('every MergeRelayAudioEvent has an asset path', () {
      for (final event in MergeRelayAudioEvent.values) {
        expect(
          mergeRelaySfxAssetPaths.containsKey(event),
          isTrue,
          reason: '$event has no entry in mergeRelaySfxAssetPaths',
        );
      }
    });

    test('plays the SFX asset for the event when Sound is enabled', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);

      await service.play(MergeRelayAudioEvent.slide);

      expect(players, hasLength(1));
      expect(players.single.calls, [
        'play(${mergeRelaySfxAssetPaths[MergeRelayAudioEvent.slide]}, '
            'loop: false, rate: 1.0)',
      ]);
    });

    test('disabling audioEnabled suppresses every SFX cue', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(
        const MergeRelayPreferences(audioEnabled: false),
      );
      final service = _service(preferences, players);

      await service.play(MergeRelayAudioEvent.button);
      await service.playMerge(4);

      expect(players, isEmpty);
    });

    test(
      'concurrent SFX calls never exceed mergeRelayMaxConcurrentSfxPlayers '
      'active players, stopping+disposing the oldest once the cap is hit',
      () async {
        final players = <_FakeAudioPlayer>[];
        final preferences = ValueNotifier(const MergeRelayPreferences());
        final service = _service(preferences, players);

        for (var i = 0; i < mergeRelayMaxConcurrentSfxPlayers + 3; i++) {
          await service.play(MergeRelayAudioEvent.button);
        }

        expect(players, hasLength(mergeRelayMaxConcurrentSfxPlayers + 3));
        expect(service.activeSfxPlayerCount, mergeRelayMaxConcurrentSfxPlayers);
        final disposedCount = players.where((p) => p.disposed).length;
        expect(disposedCount, 3);
      },
    );
  });

  group('MergeRelayAudioService.playMerge (rising pitch per tier)', () {
    test('pitch rises monotonically with the merged tile\'s tier', () {
      final rates = [
        2,
        4,
        8,
        16,
        32,
        64,
        128,
        256,
        512,
        1024,
        8192,
      ].map(mergeRelayPlaybackRateForTier).toList();
      for (var i = 1; i < rates.length; i++) {
        expect(
          rates[i],
          greaterThanOrEqualTo(rates[i - 1]),
          reason: 'rate did not rise from tier ${i - 1} to $i',
        );
      }
    });

    test('pitch never exceeds the 1.3x cap, even for a huge tile', () {
      expect(mergeRelayPlaybackRateForTier(1 << 30), lessThanOrEqualTo(1.3));
    });

    test('pitch never drops below 0.9x for the smallest tile', () {
      expect(mergeRelayPlaybackRateForTier(2), 0.9);
    });

    test('playMerge plays the merge asset at the tier-derived rate', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);

      await service.playMerge(8);

      expect(players.single.calls, [
        'play($mergeRelayMergeSfxAssetPath, loop: false, '
            'rate: ${mergeRelayPlaybackRateForTier(8)})',
      ]);
    });
  });

  group('MergeRelayAudioService music loop', () {
    test('startMusicLoop plays the looping music asset', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);

      await service.startMusicLoop();

      expect(service.isMusicLooping, isTrue);
      expect(players.single.calls, [
        'play($mergeRelayMusicLoopAssetPath, loop: true, rate: 1.0)',
      ]);
    });

    test(
      'disabling musicEnabled prevents startMusicLoop from playing',
      () async {
        final players = <_FakeAudioPlayer>[];
        final preferences = ValueNotifier(
          const MergeRelayPreferences(musicEnabled: false),
        );
        final service = _service(preferences, players);

        await service.startMusicLoop();

        expect(service.isMusicLooping, isFalse);
        expect(players, isEmpty);
      },
    );

    test('turning musicEnabled off while looping stops the loop', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);

      await service.startMusicLoop();
      expect(service.isMusicLooping, isTrue);

      preferences.value = preferences.value.copyWith(musicEnabled: false);
      await Future<void>.delayed(Duration.zero);

      expect(service.isMusicLooping, isFalse);
      expect(players.single.calls, contains('stop()'));
    });

    test('turning musicEnabled back on restarts the loop', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(
        const MergeRelayPreferences(musicEnabled: false),
      );
      final service = _service(preferences, players);
      await service.startMusicLoop();
      expect(service.isMusicLooping, isFalse);

      preferences.value = preferences.value.copyWith(musicEnabled: true);
      await Future<void>.delayed(Duration.zero);

      expect(service.isMusicLooping, isTrue);
    });

    test('disabling audioEnabled does not stop the music loop (separate '
        'channels)', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);
      await service.startMusicLoop();

      preferences.value = preferences.value.copyWith(audioEnabled: false);
      await Future<void>.delayed(Duration.zero);

      expect(service.isMusicLooping, isTrue);
    });

    test('startMusicLoop is idempotent while already looping', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);

      await service.startMusicLoop();
      await service.startMusicLoop();

      expect(players, hasLength(1));
    });
  });

  group('MergeRelayAudioService lifecycle pause/resume', () {
    test('pauseMusicForLifecycle pauses without stopping the loop', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);
      await service.startMusicLoop();

      await service.pauseMusicForLifecycle();

      expect(service.isMusicLooping, isTrue);
      expect(players.single.calls, contains('pause()'));
      expect(players.single.calls, isNot(contains('stop()')));
    });

    test('resumeMusicForLifecycle resumes after a lifecycle pause', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);
      await service.startMusicLoop();
      await service.pauseMusicForLifecycle();

      await service.resumeMusicForLifecycle();

      expect(players.single.calls, contains('resume()'));
    });

    test('resumeMusicForLifecycle stops (rather than resumes) if Music was '
        'turned off while backgrounded', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);
      await service.startMusicLoop();
      await service.pauseMusicForLifecycle();

      preferences.value = preferences.value.copyWith(musicEnabled: false);
      await service.resumeMusicForLifecycle();

      expect(service.isMusicLooping, isFalse);
      expect(players.single.calls, isNot(contains('resume()')));
    });

    test('resumeMusicForLifecycle without a prior pause is a no-op', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players);
      await service.startMusicLoop();

      await service.resumeMusicForLifecycle();

      expect(players.single.calls, isNot(contains('resume()')));
    });
  });

  group('MergeRelayAudioService failure handling', () {
    test('a failing player never throws for one-shot SFX', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players, failing: true);

      await expectLater(service.play(MergeRelayAudioEvent.button), completes);
    });

    test('a failing player never throws for the music loop', () async {
      final players = <_FakeAudioPlayer>[];
      final preferences = ValueNotifier(const MergeRelayPreferences());
      final service = _service(preferences, players, failing: true);

      await expectLater(service.startMusicLoop(), completes);
      await expectLater(service.pauseMusicForLifecycle(), completes);
      await expectLater(service.resumeMusicForLifecycle(), completes);
      await expectLater(service.dispose(), completes);
    });
  });
}
