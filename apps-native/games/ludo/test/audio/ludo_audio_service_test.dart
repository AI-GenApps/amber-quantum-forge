import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/audio/ludo_audio_service.dart';
import 'package:ludo/src/audio/ludo_haptics.dart';
import 'package:ludo/src/state/ludo_sound_settings.dart';

/// Records every call instead of touching a real platform audio channel.
class _FakeAudioPlayer implements LudoAudioPlayer {
  final List<String> calls = [];
  bool disposed = false;

  @override
  Future<void> play(String assetPath, {bool loop = false}) async {
    calls.add('play($assetPath, loop: $loop)');
  }

  @override
  Future<void> stop() async {
    calls.add('stop()');
  }

  @override
  Future<void> dispose() async {
    disposed = true;
    calls.add('dispose()');
  }
}

void main() {
  group('LudoAudioService.playSfx', () {
    test('every LudoFeedbackEvent has an asset path', () {
      for (final event in LudoFeedbackEvent.values) {
        expect(
          ludoSfxAssetPaths.containsKey(event),
          isTrue,
          reason: '$event has no entry in ludoSfxAssetPaths',
        );
      }
    });

    test('plays the SFX asset for the event when sound is enabled', () async {
      final players = <_FakeAudioPlayer>[];
      final settings = LudoSoundSettings();
      final service = LudoAudioService(
        settings: settings,
        playerFactory: () {
          final player = _FakeAudioPlayer();
          players.add(player);
          return player;
        },
      );

      await service.playSfx(LudoFeedbackEvent.diceRoll);

      expect(players, hasLength(1));
      expect(players.single.calls, [
        'play(${ludoSfxAssetPaths[LudoFeedbackEvent.diceRoll]}, loop: false)',
      ]);
    });

    test('disabling soundEnabled suppresses playSfx entirely', () async {
      final players = <_FakeAudioPlayer>[];
      final settings = LudoSoundSettings(soundEnabled: false);
      final service = LudoAudioService(
        settings: settings,
        playerFactory: () {
          final player = _FakeAudioPlayer();
          players.add(player);
          return player;
        },
      );

      await service.playSfx(LudoFeedbackEvent.capture);
      await service.playSfx(LudoFeedbackEvent.win);

      expect(players, isEmpty);
    });

    test('concurrent SFX calls never exceed ludoMaxConcurrentSfxPlayers active '
        'players, stopping+disposing the oldest once the cap is hit', () async {
      final players = <_FakeAudioPlayer>[];
      final settings = LudoSoundSettings();
      final service = LudoAudioService(
        settings: settings,
        playerFactory: () {
          final player = _FakeAudioPlayer();
          players.add(player);
          return player;
        },
      );

      for (var i = 0; i < ludoMaxConcurrentSfxPlayers + 3; i++) {
        await service.playSfx(LudoFeedbackEvent.tokenStep);
      }

      // One player created per call...
      expect(players, hasLength(ludoMaxConcurrentSfxPlayers + 3));
      // ...but never more than the cap tracked as active at once.
      expect(service.activeSfxPlayerCount, ludoMaxConcurrentSfxPlayers);
      // The extra players beyond the cap were stopped and disposed, not
      // leaked.
      final disposedCount = players.where((p) => p.disposed).length;
      expect(disposedCount, 3);
    });
  });

  group('LudoAudioService music loop', () {
    test('startMusicLoop plays the looping music asset', () async {
      final players = <_FakeAudioPlayer>[];
      final settings = LudoSoundSettings();
      final service = LudoAudioService(
        settings: settings,
        playerFactory: () {
          final player = _FakeAudioPlayer();
          players.add(player);
          return player;
        },
      );

      await service.startMusicLoop();

      expect(service.isMusicLooping, isTrue);
      expect(players.single.calls, [
        'play($ludoMusicLoopAssetPath, loop: true)',
      ]);
    });

    test(
      'disabling musicEnabled prevents startMusicLoop from playing',
      () async {
        final players = <_FakeAudioPlayer>[];
        final settings = LudoSoundSettings(musicEnabled: false);
        final service = LudoAudioService(
          settings: settings,
          playerFactory: () {
            final player = _FakeAudioPlayer();
            players.add(player);
            return player;
          },
        );

        await service.startMusicLoop();

        expect(service.isMusicLooping, isFalse);
        expect(players, isEmpty);
      },
    );

    test('turning musicEnabled off while looping stops the loop', () async {
      final players = <_FakeAudioPlayer>[];
      final settings = LudoSoundSettings();
      final service = LudoAudioService(
        settings: settings,
        playerFactory: () {
          final player = _FakeAudioPlayer();
          players.add(player);
          return player;
        },
      );

      await service.startMusicLoop();
      expect(service.isMusicLooping, isTrue);

      settings.musicEnabled = false;
      // The listener-driven stop is fire-and-forget; pump the microtask
      // queue so it has run.
      await Future<void>.delayed(Duration.zero);

      expect(service.isMusicLooping, isFalse);
      expect(players.single.calls, contains('stop()'));
    });

    test('startMusicLoop is idempotent while already looping', () async {
      final players = <_FakeAudioPlayer>[];
      final settings = LudoSoundSettings();
      final service = LudoAudioService(
        settings: settings,
        playerFactory: () {
          final player = _FakeAudioPlayer();
          players.add(player);
          return player;
        },
      );

      await service.startMusicLoop();
      await service.startMusicLoop();

      expect(players, hasLength(1));
      expect(players.single.calls, [
        'play($ludoMusicLoopAssetPath, loop: true)',
      ]);
    });
  });

  group('LudoFeedbackService', () {
    test('trigger plays SFX and haptics together for one event', () async {
      final players = <_FakeAudioPlayer>[];
      final settings = LudoSoundSettings();
      final audio = LudoAudioService(
        settings: settings,
        playerFactory: () {
          final player = _FakeAudioPlayer();
          players.add(player);
          return player;
        },
      );
      final hapticCalls = <String>[];
      final haptics = LudoHaptics(
        settings: settings,
        channel: _RecordingHapticsChannel(hapticCalls),
      );
      final feedback = LudoFeedbackService(audio: audio, haptics: haptics);

      await feedback.trigger(LudoFeedbackEvent.win);

      expect(players.single.calls, [
        'play(${ludoSfxAssetPaths[LudoFeedbackEvent.win]}, loop: false)',
      ]);
      expect(hapticCalls, ['heavyImpact()']);
    });
  });
}

class _RecordingHapticsChannel implements LudoHapticsChannel {
  _RecordingHapticsChannel(this.calls);

  final List<String> calls;

  @override
  Future<void> lightImpact() async => calls.add('lightImpact()');

  @override
  Future<void> mediumImpact() async => calls.add('mediumImpact()');

  @override
  Future<void> heavyImpact() async => calls.add('heavyImpact()');

  @override
  Future<void> selectionClick() async => calls.add('selectionClick()');
}
