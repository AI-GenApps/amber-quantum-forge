/// [MergeRelayAudioService]: the gated, testable layer
/// `merge_relay_audio.dart`'s [MergeRelayAudioPlayer] seam sits behind.
/// Split from that file to keep each file well under the repo's 300-line
/// cap.
library;

import 'dart:async' show unawaited;

import 'package:flutter/foundation.dart' show ValueListenable;

import '../merge_relay_models.dart';
import 'merge_relay_audio.dart';

/// Plays SFX and looping music for Merge Relay, gated by the live
/// [MergeRelayPreferences] the game already exposes (`audioEnabled` for
/// SFX via [play]/[playMerge], `musicEnabled` for [startMusicLoop]) —
/// no parallel settings object, unlike Ludo's `LudoSoundSettings`, since
/// Merge Relay's preferences are already a single `ValueNotifier` every
/// other toggle (haptics, reduced motion, ...) reads the same way.
///
/// Every call is safe to repeat and safe to call on a player that throws
/// (a missing asset, a lost platform channel, ...): SFX and music are
/// always best-effort, per the task's "must never block or crash gameplay"
/// requirement.
class MergeRelayAudioService {
  MergeRelayAudioService({
    required this.preferences,
    MergeRelayAudioPlayerFactory? playerFactory,
  }) : _playerFactory = playerFactory ?? RealMergeRelayAudioPlayer.new {
    preferences.addListener(_onPreferencesChanged);
  }

  /// The game's live preferences — read directly rather than through a
  /// parallel settings object (see class doc).
  final ValueListenable<MergeRelayPreferences> preferences;
  final MergeRelayAudioPlayerFactory _playerFactory;

  final List<MergeRelayAudioPlayer> _activeSfxPlayers = [];
  MergeRelayAudioPlayer? _musicPlayer;
  bool _musicLooping = false;
  bool _musicPausedForLifecycle = false;

  /// The number of SFX players currently tracked as active (bounded by
  /// [mergeRelayMaxConcurrentSfxPlayers]). Exposed for tests.
  int get activeSfxPlayerCount => _activeSfxPlayers.length;

  /// Whether the music loop is currently (believed to be) playing —
  /// `false` while paused for an app-lifecycle background transition, see
  /// [pauseMusicForLifecycle].
  bool get isMusicLooping => _musicLooping;

  void _onPreferencesChanged() {
    // Fire-and-forget: a ChangeNotifier/ValueNotifier listener callback is
    // synchronous, and the Settings toggle that flips `musicEnabled`
    // doesn't need to await the loop actually starting/stopping.
    if (!preferences.value.musicEnabled) {
      if (_musicLooping) unawaited(stopMusicLoop());
      return;
    }
    if (!_musicLooping && !_musicPausedForLifecycle) {
      unawaited(startMusicLoop());
    }
  }

  /// Plays the flat SFX for [event], unless
  /// [MergeRelayPreferences.audioEnabled] is `false`.
  Future<void> play(MergeRelayAudioEvent event) async {
    if (!preferences.value.audioEnabled) return;
    final assetPath = mergeRelaySfxAssetPaths[event];
    if (assetPath == null) return;
    await _playOneShot(assetPath);
  }

  /// Plays the merge chime for a destination tile that landed on
  /// [mergedValue], pitched per [mergeRelayPlaybackRateForTier], unless
  /// [MergeRelayPreferences.audioEnabled] is `false`.
  Future<void> playMerge(int mergedValue) async {
    if (!preferences.value.audioEnabled) return;
    await _playOneShot(
      mergeRelayMergeSfxAssetPath,
      playbackRate: mergeRelayPlaybackRateForTier(mergedValue),
    );
  }

  Future<void> _playOneShot(
    String assetPath, {
    double playbackRate = 1.0,
  }) async {
    if (_activeSfxPlayers.length >= mergeRelayMaxConcurrentSfxPlayers) {
      final oldest = _activeSfxPlayers.removeAt(0);
      await _safely(oldest.stop);
      await _safely(oldest.dispose);
    }
    final player = _playerFactory();
    _activeSfxPlayers.add(player);
    await _safely(() => player.play(assetPath, playbackRate: playbackRate));
  }

  /// Starts the looping background track, unless
  /// [MergeRelayPreferences.musicEnabled] is `false` or it is already
  /// looping.
  Future<void> startMusicLoop() async {
    if (!preferences.value.musicEnabled || _musicLooping) return;
    _musicPlayer ??= _playerFactory();
    await _safely(
      () => _musicPlayer!.play(mergeRelayMusicLoopAssetPath, loop: true),
    );
    _musicLooping = true;
    _musicPausedForLifecycle = false;
  }

  /// Stops the looping background track, if playing.
  Future<void> stopMusicLoop() async {
    if (!_musicLooping) return;
    await _safely(() => _musicPlayer?.stop() ?? Future.value());
    _musicLooping = false;
    _musicPausedForLifecycle = false;
  }

  /// Pauses the music loop for an app-lifecycle background transition
  /// (`AppLifecycleState.inactive`/`paused`/`hidden`), remembering to
  /// resume it in [resumeMusicForLifecycle] — a no-op if music wasn't
  /// looping.
  Future<void> pauseMusicForLifecycle() async {
    if (!_musicLooping) return;
    await _safely(() => _musicPlayer?.pause() ?? Future.value());
    _musicPausedForLifecycle = true;
  }

  /// Resumes music paused by [pauseMusicForLifecycle] on returning to the
  /// foreground. A no-op if music wasn't paused for a lifecycle
  /// transition; stops (rather than resumes) if Music was turned off while
  /// backgrounded.
  Future<void> resumeMusicForLifecycle() async {
    if (!_musicPausedForLifecycle) return;
    _musicPausedForLifecycle = false;
    if (!preferences.value.musicEnabled) {
      await stopMusicLoop();
      return;
    }
    await _safely(() => _musicPlayer?.resume() ?? Future.value());
  }

  /// Runs [action], swallowing any error it throws — the single point
  /// every player call in this service goes through, so a failing player
  /// (missing file, lost audio focus, an unmocked platform channel under
  /// test) can never crash or block gameplay.
  Future<void> _safely(Future<void> Function() action) async {
    try {
      await action();
    } catch (_) {}
  }

  /// Releases every tracked player. Call when the audio service is no
  /// longer needed (e.g. app teardown).
  ///
  /// Snapshots and clears [_activeSfxPlayers] before awaiting anything: a
  /// fire-and-forget [_playOneShot] call still in flight when `dispose` is
  /// called (every `game_actions.dart` call site is `unawaited`) can mutate
  /// that list across an `await` inside this loop otherwise, which throws
  /// a concurrent-modification error rather than just leaking or
  /// double-disposing a player.
  Future<void> dispose() async {
    preferences.removeListener(_onPreferencesChanged);
    final players = List<MergeRelayAudioPlayer>.of(_activeSfxPlayers);
    _activeSfxPlayers.clear();
    for (final player in players) {
      await _safely(player.dispose);
    }
    await _safely(() => _musicPlayer?.dispose() ?? Future.value());
    _musicPlayer = null;
    _musicLooping = false;
    _musicPausedForLifecycle = false;
  }
}
