/// Installs a fully in-memory `audioplayers` platform implementation for
/// `flutter test`, so `MergeRelayGame`'s real, un-injected
/// `RealMergeRelayAudioPlayer` (see `lib/src/audio/merge_relay_audio.dart`)
/// never touches a platform channel while under test.
///
/// Without this, `ap.AudioPlayer()`'s constructor eagerly calls
/// `AudioplayersPlatformInterface.instance.create(playerId)` and subscribes
/// to a per-player `EventChannel('xyz.luan/audioplayers/events/$playerId')`
/// (a random UUID per player, so it can't be pre-mocked by exact channel
/// name the way a fixed-name `MethodChannel` can). Under `flutter test`
/// there is no such plugin registered, so that subscription throws
/// `MissingPluginException` — not through the awaited `Future` chain
/// `RealMergeRelayAudioPlayer`'s try/catch guards, but via the platform
/// `EventChannel`'s internal error zone, which `flutter_test` reports as an
/// uncaught test failure regardless of that try/catch.
///
/// `audioplayers` is a federated plugin: every platform call goes through
/// the swappable `AudioplayersPlatformInterface.instance` (and, for a few
/// global calls `AudioPlayer.global` makes on first use,
/// `GlobalAudioplayersPlatformInterface.instance`) rather than a hard-coded
/// channel. Installing no-op fakes here is the supported way to keep a real
/// `AudioPlayer` usable, but silent, under test — see the package's own
/// `MethodChannelAudioplayersPlatform`/`GlobalAudioplayersPlatform` for the
/// shape being replaced.
library;

import 'dart:typed_data' show Uint8List;

import 'package:audioplayers_platform_interface/audioplayers_platform_interface.dart';

/// Call once, before any widget/golden test that boots a real
/// `MergeRelayGame` (i.e. every test using `MergeRelayApp` without an
/// injected fake audio player factory) — see
/// `test/flutter_test_config.dart`, which calls this for every test file.
void installFakeAudioplayersPlatform() {
  AudioplayersPlatformInterface.instance = _FakeAudioplayersPlatform();
  GlobalAudioplayersPlatformInterface.instance =
      _FakeGlobalAudioplayersPlatform();
}

class _FakeAudioplayersPlatform extends AudioplayersPlatformInterface {
  @override
  Future<void> create(String playerId) async {}

  @override
  Future<void> dispose(String playerId) async {}

  @override
  Future<void> pause(String playerId) async {}

  @override
  Future<void> stop(String playerId) async {}

  @override
  Future<void> resume(String playerId) async {}

  @override
  Future<void> release(String playerId) async {}

  @override
  Future<void> seek(String playerId, Duration position) async {}

  @override
  Future<void> setBalance(String playerId, double balance) async {}

  @override
  Future<void> setVolume(String playerId, double volume) async {}

  @override
  Future<void> setReleaseMode(String playerId, ReleaseMode releaseMode) async {}

  @override
  Future<void> setPlaybackRate(String playerId, double playbackRate) async {}

  @override
  Future<void> setSourceUrl(
    String playerId,
    String url, {
    bool? isLocal,
    String? mimeType,
  }) async {}

  @override
  Future<void> setSourceBytes(
    String playerId,
    Uint8List bytes, {
    String? mimeType,
  }) async {}

  @override
  Future<void> setAudioContext(
    String playerId,
    AudioContext audioContext,
  ) async {}

  @override
  Future<void> setPlayerMode(String playerId, PlayerMode playerMode) async {}

  @override
  Future<int?> getDuration(String playerId) async => null;

  @override
  Future<int?> getCurrentPosition(String playerId) async => null;

  @override
  Future<void> emitLog(String playerId, String message) async {}

  @override
  Future<void> emitError(String playerId, String code, String message) async {}

  @override
  Stream<AudioEvent> getEventStream(String playerId) => const Stream.empty();
}

class _FakeGlobalAudioplayersPlatform
    implements GlobalAudioplayersPlatformInterface {
  @override
  Future<void> init() async {}

  @override
  Future<void> setGlobalAudioContext(AudioContext ctx) async {}

  @override
  Future<void> emitGlobalLog(String message) async {}

  @override
  Future<void> emitGlobalError(String code, String message) async {}

  @override
  Stream<GlobalAudioEvent> getGlobalEventStream() => const Stream.empty();
}
