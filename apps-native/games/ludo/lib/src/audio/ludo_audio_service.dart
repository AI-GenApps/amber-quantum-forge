/// Real SFX/music playback for Ludo, replacing `ludo_art_manifest.dart`'s
/// silent no-op audio slots.
///
/// Package choice: **`audioplayers`**, not `flame_audio`. `flame_audio` is
/// itself a thin wrapper around `audioplayers`'s `AudioCache` +
/// `AudioPlayer`, so picking `audioplayers` directly gives the same
/// underlying playback with two things this task needs that the wrapper
/// doesn't expose as cleanly: (1) creating our own bounded pool of
/// [ap.AudioPlayer] instances so concurrent SFX calls can be capped (see
/// [ludoMaxConcurrentSfxPlayers]) rather than relying on `flame_audio`'s
/// internal cache/pool sizing, and (2) an injectable [LudoAudioPlayer]
/// seam ([LudoAudioPlayerFactory]) so `test/audio/ludo_audio_service_test.dart`
/// can assert on play/stop/dispose calls with a fake player instead of
/// touching a real platform audio channel (unavailable/irrelevant under
/// `flutter test`).
library;

import 'dart:async' show unawaited;

import 'package:audioplayers/audioplayers.dart' as ap;

import '../state/ludo_sound_settings.dart';
import 'ludo_haptics.dart';

/// Asset-relative paths (relative to `assets/audio/`, as `audioplayers`'
/// [ap.AssetSource] expects — see its `assetPathPrefix`) for each SFX slot.
/// One entry per [LudoFeedbackEvent] value, checked by
/// `test/audio/ludo_audio_service_test.dart` to stay exhaustive.
const Map<LudoFeedbackEvent, String> ludoSfxAssetPaths = {
  LudoFeedbackEvent.diceRoll: 'audio/sfx_dice_roll.ogg',
  LudoFeedbackEvent.tokenStep: 'audio/sfx_token_step.ogg',
  LudoFeedbackEvent.capture: 'audio/sfx_capture.ogg',
  LudoFeedbackEvent.homeArrival: 'audio/sfx_home_arrival.ogg',
  LudoFeedbackEvent.win: 'audio/sfx_win.ogg',
  LudoFeedbackEvent.buttonTap: 'audio/sfx_button_tap.ogg',
  LudoFeedbackEvent.turnAlert: 'audio/sfx_turn_alert.ogg',
};

/// Asset-relative path to the single looping background track.
const String ludoMusicLoopAssetPath = 'audio/music_loop.ogg';

/// Maximum number of concurrent one-shot SFX players
/// [LudoAudioService.playSfx] keeps alive at once. Once this cap is hit, the
/// oldest still-tracked player is stopped and disposed before starting the
/// new one, so a burst of overlapping SFX (e.g. several tokens hopping in
/// quick succession) never leaks an unbounded number of native players.
const int ludoMaxConcurrentSfxPlayers = 4;

/// Minimal seam [LudoAudioService] plays through, so tests can substitute a
/// fake that records calls instead of touching a real platform channel.
abstract class LudoAudioPlayer {
  /// Plays the asset at [assetPath] (relative to `assets/audio/`), looping
  /// forever when [loop] is `true`.
  Future<void> play(String assetPath, {bool loop = false});

  /// Stops playback without releasing the underlying player.
  Future<void> stop();

  /// Releases the underlying player. Must be safe to call even if [play]
  /// was never called.
  Future<void> dispose();
}

/// Creates a new [LudoAudioPlayer]. The default (see
/// [LudoAudioService.new]) creates a real [ap.AudioPlayer]-backed one;
/// tests inject a fake factory instead.
typedef LudoAudioPlayerFactory = LudoAudioPlayer Function();

/// The real, `audioplayers`-backed [LudoAudioPlayer].
class _RealLudoAudioPlayer implements LudoAudioPlayer {
  final ap.AudioPlayer _player = ap.AudioPlayer();

  @override
  Future<void> play(String assetPath, {bool loop = false}) async {
    await _player.setReleaseMode(
      loop ? ap.ReleaseMode.loop : ap.ReleaseMode.release,
    );
    await _player.play(ap.AssetSource(assetPath));
  }

  @override
  Future<void> stop() => _player.stop();

  @override
  Future<void> dispose() => _player.dispose();
}

/// Plays SFX and looping music for Ludo, gated by [LudoSoundSettings].
///
/// - [playSfx] fires a one-shot sound for a [LudoFeedbackEvent], subject to
///   [LudoSoundSettings.soundEnabled] and a bounded pool of concurrent
///   players ([ludoMaxConcurrentSfxPlayers]).
/// - [startMusicLoop] / [stopMusicLoop] control the single looping
///   background track, subject to [LudoSoundSettings.musicEnabled] —
///   including reacting live if music is disabled mid-loop.
///
/// Every call is safe to repeat: calling [playSfx] again while sound is
/// disabled is a no-op, and [startMusicLoop] is idempotent (calling it
/// again while already looping does nothing).
class LudoAudioService {
  LudoAudioService({
    required this.settings,
    LudoAudioPlayerFactory? playerFactory,
  }) : _playerFactory = playerFactory ?? _RealLudoAudioPlayer.new {
    settings.addListener(_onSettingsChanged);
  }

  final LudoSoundSettings settings;
  final LudoAudioPlayerFactory _playerFactory;

  final List<LudoAudioPlayer> _activeSfxPlayers = [];
  LudoAudioPlayer? _musicPlayer;
  bool _musicLooping = false;

  /// The number of SFX players currently tracked as active (bounded by
  /// [ludoMaxConcurrentSfxPlayers]). Exposed for tests.
  int get activeSfxPlayerCount => _activeSfxPlayers.length;

  /// Whether the music loop is currently (believed to be) playing.
  bool get isMusicLooping => _musicLooping;

  void _onSettingsChanged() {
    if (!settings.musicEnabled && _musicLooping) {
      // Fire-and-forget: a ChangeNotifier listener callback is synchronous,
      // and the caller of `settings.musicEnabled = false` doesn't need to
      // await the loop actually stopping.
      unawaited(stopMusicLoop());
    }
  }

  /// Plays the SFX for [event], unless [LudoSoundSettings.soundEnabled] is
  /// `false`. Bounded by [ludoMaxConcurrentSfxPlayers]: once that many SFX
  /// players are active, the oldest is stopped and disposed first.
  Future<void> playSfx(LudoFeedbackEvent event) async {
    if (!settings.soundEnabled) return;
    final assetPath = ludoSfxAssetPaths[event];
    if (assetPath == null) return;

    if (_activeSfxPlayers.length >= ludoMaxConcurrentSfxPlayers) {
      final oldest = _activeSfxPlayers.removeAt(0);
      await oldest.stop();
      await oldest.dispose();
    }
    final player = _playerFactory();
    _activeSfxPlayers.add(player);
    await player.play(assetPath);
  }

  /// Starts the looping background track, unless
  /// [LudoSoundSettings.musicEnabled] is `false` or it is already looping.
  Future<void> startMusicLoop() async {
    if (!settings.musicEnabled || _musicLooping) return;
    _musicPlayer ??= _playerFactory();
    await _musicPlayer!.play(ludoMusicLoopAssetPath, loop: true);
    _musicLooping = true;
  }

  /// Stops the looping background track, if playing.
  Future<void> stopMusicLoop() async {
    if (!_musicLooping) return;
    await _musicPlayer?.stop();
    _musicLooping = false;
  }

  /// Releases every tracked player. Call when the audio service is no
  /// longer needed (e.g. app teardown in tests).
  Future<void> dispose() async {
    settings.removeListener(_onSettingsChanged);
    for (final player in _activeSfxPlayers) {
      await player.dispose();
    }
    _activeSfxPlayers.clear();
    await _musicPlayer?.dispose();
    _musicPlayer = null;
    _musicLooping = false;
  }
}

/// Combines [LudoAudioService] and [LudoHaptics] behind the single
/// `LudoFeedbackEvent`-keyed call site every gameplay call site
/// (`lib/src/game/*.dart`, `lib/src/assets/ludo_art_manifest.dart`) uses,
/// so SFX and haptics can never drift apart the way two independently
/// called services could.
class LudoFeedbackService {
  LudoFeedbackService({required this.audio, required this.haptics});

  final LudoAudioService audio;
  final LudoHaptics haptics;

  /// Plays [event]'s SFX and haptic pattern together.
  Future<void> trigger(LudoFeedbackEvent event) async {
    await Future.wait([audio.playSfx(event), haptics.trigger(event)]);
  }

  /// Starts the looping background track (see
  /// [LudoAudioService.startMusicLoop]).
  Future<void> startMusic() => audio.startMusicLoop();

  /// Stops the looping background track (see
  /// [LudoAudioService.stopMusicLoop]).
  Future<void> stopMusic() => audio.stopMusicLoop();
}
