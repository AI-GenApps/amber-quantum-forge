/// Real SFX/music playback for Merge Relay, wired to the move-trace events
/// task 09 introduced (`MergeRelayGameActions.move`/`_finish` in
/// `merge_relay_game_actions.dart`) the same way `merge_relay_haptics.dart`
/// is: both fire off the same call sites, gated by their own toggle in
/// `MergeRelayPreferences`.
///
/// Package choice: **`audioplayers`** (see `apps-native/games/ludo`'s use
/// of the same package for the same reasoning — a directly injectable
/// [MergeRelayAudioPlayer] seam so tests never touch a real platform audio
/// channel, and a small bounded pool of concurrent SFX players).
library;

import 'package:audioplayers/audioplayers.dart' as ap;

/// The flat, one-cue-per-event SFX Merge Relay's move-trace and lifecycle
/// events fire. `merge` is deliberately not a member here: its pitch rises
/// with the merged tile's tier, so it goes through
/// [MergeRelayAudioService.playMerge] instead — see
/// [mergeRelayPlaybackRateForTier].
enum MergeRelayAudioEvent {
  slide,
  spawn,
  bestTile,
  boardCleared,
  outOfMoves,
  button,
}

/// Asset-relative paths (relative to `assets/audio/`, as `audioplayers`'
/// [ap.AssetSource] expects) for each [MergeRelayAudioEvent]. One entry per
/// value, checked by `test/audio/merge_relay_audio_test.dart` to stay
/// exhaustive.
const Map<MergeRelayAudioEvent, String> mergeRelaySfxAssetPaths = {
  MergeRelayAudioEvent.slide: 'audio/sfx_slide.ogg',
  MergeRelayAudioEvent.spawn: 'audio/sfx_spawn.ogg',
  MergeRelayAudioEvent.bestTile: 'audio/sfx_best_tile.ogg',
  MergeRelayAudioEvent.boardCleared: 'audio/sfx_board_cleared.ogg',
  MergeRelayAudioEvent.outOfMoves: 'audio/sfx_out_of_moves.ogg',
  MergeRelayAudioEvent.button: 'audio/sfx_button.ogg',
};

/// Asset-relative path for the merge chime, always played through
/// [MergeRelayAudioService.playMerge] at a tier-dependent playback rate
/// rather than the fixed rate every [mergeRelaySfxAssetPaths] cue uses.
const String mergeRelayMergeSfxAssetPath = 'audio/sfx_merge.ogg';

/// Asset-relative path to the single looping background track.
const String mergeRelayMusicLoopAssetPath = 'audio/music_loop.ogg';

/// Maximum number of concurrent one-shot SFX players
/// [MergeRelayAudioService] keeps alive at once — see
/// `LudoAudioService.playSfx`'s identical reasoning: a burst of overlapping
/// SFX (e.g. several quick moves) never leaks an unbounded number of
/// native players.
const int mergeRelayMaxConcurrentSfxPlayers = 4;

/// Maps a merged tile's new value (a power of two: 2, 4, 8, ...) to an
/// `audioplayers` playback rate for [MergeRelayAudioService.playMerge]:
/// each tier a little higher-pitched than the last, capped at 1.3x (per the
/// task's decision) so a late-game high tier never turns shrill.
double mergeRelayPlaybackRateForTier(int mergedValue) {
  if (mergedValue < 2) return 0.9;
  final tierIndex = (mergedValue.bitLength - 2).clamp(0, 100);
  return (0.9 + tierIndex * 0.05).clamp(0.9, 1.3);
}

/// Minimal seam [MergeRelayAudioService] plays through, so tests can
/// substitute a fake that records calls instead of touching a real
/// platform channel.
abstract class MergeRelayAudioPlayer {
  /// Plays the asset at [assetPath] (relative to `assets/audio/`), looping
  /// forever when [loop] is `true`, at [playbackRate] (1.0 is normal
  /// speed/pitch).
  Future<void> play(
    String assetPath, {
    bool loop = false,
    double playbackRate = 1.0,
  });

  /// Pauses playback in place, resumable with [resume].
  Future<void> pause();

  /// Resumes playback paused by [pause].
  Future<void> resume();

  /// Stops playback without releasing the underlying player.
  Future<void> stop();

  /// Releases the underlying player. Must be safe to call even if [play]
  /// was never called.
  Future<void> dispose();
}

/// Creates a new [MergeRelayAudioPlayer]. The default (see
/// [MergeRelayAudioService.new]) creates a real [ap.AudioPlayer]-backed
/// one; tests inject a fake factory instead.
typedef MergeRelayAudioPlayerFactory = MergeRelayAudioPlayer Function();

/// The real, `audioplayers`-backed [MergeRelayAudioPlayer] —
/// [MergeRelayAudioService]'s default when no [MergeRelayAudioPlayerFactory]
/// is injected (tests inject a fake instead; see
/// `test/audio/merge_relay_audio_test.dart`). Every call is wrapped so a
/// missing asset, lost audio focus, or (as under `flutter test`, which has
/// no real audio platform channel registered) an unmocked plugin call never
/// throws — audio is always best-effort and must never block or crash
/// gameplay.
class RealMergeRelayAudioPlayer implements MergeRelayAudioPlayer {
  final ap.AudioPlayer _player = ap.AudioPlayer();

  @override
  Future<void> play(
    String assetPath, {
    bool loop = false,
    double playbackRate = 1.0,
  }) async {
    try {
      await _player.setReleaseMode(
        loop ? ap.ReleaseMode.loop : ap.ReleaseMode.release,
      );
      await _player.setPlaybackRate(playbackRate);
      await _player.play(ap.AssetSource(assetPath));
    } catch (_) {
      // See class doc: best-effort playback only.
    }
  }

  @override
  Future<void> pause() async {
    try {
      await _player.pause();
    } catch (_) {}
  }

  @override
  Future<void> resume() async {
    try {
      await _player.resume();
    } catch (_) {}
  }

  @override
  Future<void> stop() async {
    try {
      await _player.stop();
    } catch (_) {}
  }

  @override
  Future<void> dispose() async {
    try {
      await _player.dispose();
    } catch (_) {}
  }
}
