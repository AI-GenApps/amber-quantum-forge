import 'dart:async';

import 'package:flutter/services.dart';

abstract interface class MergeRelayChallengeLinkSource {
  Future<List<String>> initialize();

  Stream<String> get links;

  void dispose();
}

final class MethodChannelMergeRelayChallengeLinkSource
    implements MergeRelayChallengeLinkSource {
  MethodChannelMergeRelayChallengeLinkSource({MethodChannel? channel})
    : _channel = channel ?? _defaultChannel;

  static const _defaultChannel = MethodChannel(
    'app.w3dev.mergerelay/challenge_links',
  );

  final MethodChannel _channel;
  final StreamController<String> _linkController =
      StreamController<String>.broadcast(sync: true);
  Future<List<String>>? _initialization;
  bool _disposed = false;

  @override
  Stream<String> get links => _linkController.stream;

  @override
  Future<List<String>> initialize() => _initialization ??= _initialize();

  Future<List<String>> _initialize() async {
    if (_disposed) return const [];
    _channel.setMethodCallHandler(_handleMethodCall);
    try {
      final value = await _channel.invokeMethod<Object?>('take_pending_links');
      if (value is! List) return const [];
      return List.unmodifiable(
        value.whereType<String>().where(_isCandidate).toList(growable: false),
      );
    } on MissingPluginException {
      return const [];
    } on PlatformException {
      return const [];
    }
  }

  Future<Object?> _handleMethodCall(MethodCall call) async {
    if (call.method == 'link_received' && call.arguments is String) {
      final value = call.arguments as String;
      if (!_disposed && _isCandidate(value)) _linkController.add(value);
    }
    return null;
  }

  @override
  void dispose() {
    if (_disposed) return;
    _disposed = true;
    _channel.setMethodCallHandler(null);
    _linkController.close();
  }

  static bool _isCandidate(String value) {
    final trimmed = value.trim();
    return trimmed.isNotEmpty && trimmed.length <= 512;
  }
}
