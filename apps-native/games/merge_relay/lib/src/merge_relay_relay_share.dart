import 'package:flutter/services.dart';

import 'network/merge_relay_models.dart';

enum MergeRelayShareStatus { opened, unavailable, failed }

final class MergeRelaySharePayload {
  const MergeRelaySharePayload({
    required this.challengeId,
    required this.creatorAlias,
    required this.code,
    required this.appLink,
    required this.httpsLink,
  });

  factory MergeRelaySharePayload.fromChallenge(
    MergeRelayChallenge challenge, {
    Uri? publicOrigin,
    String? environment,
  }) {
    final id = challenge.challengeId;
    final appLink = Uri(
      scheme: 'mergerelay',
      host: 'challenge',
      path: '/$id',
    ).toString();
    final httpsLink =
        publicOrigin == null ||
            !_isAcceptedOrigin(publicOrigin) ||
            environment != null && !_environments.contains(environment)
        ? null
        : Uri(
            scheme: publicOrigin.scheme,
            host: publicOrigin.host,
            port: publicOrigin.hasPort ? publicOrigin.port : null,
            path: '/games/merge-relay/challenges/$id',
            queryParameters: environment == null
                ? null
                : {'environment': environment},
          ).toString();
    return MergeRelaySharePayload(
      challengeId: id,
      creatorAlias: challenge.creatorAlias,
      code: id,
      appLink: appLink,
      httpsLink: httpsLink,
    );
  }

  final String challengeId;
  final String creatorAlias;
  final String code;
  final String appLink;
  final String? httpsLink;

  String get preferredLink => httpsLink ?? appLink;

  String get message => 'Join $creatorAlias in Merge Relay: $preferredLink';
}

bool _isAcceptedOrigin(Uri value) =>
    value.scheme.toLowerCase() == 'https' &&
    value.host.isNotEmpty &&
    value.userInfo.isEmpty &&
    value.query.isEmpty &&
    value.fragment.isEmpty &&
    (value.path.isEmpty || value.path == '/');

const _environments = {'debug', 'staging', 'production'};

abstract interface class MergeRelayShareProvider {
  Future<MergeRelayShareStatus> share(MergeRelaySharePayload payload);
}

final class MethodChannelMergeRelayShareProvider
    implements MergeRelayShareProvider {
  MethodChannelMergeRelayShareProvider({MethodChannel? channel})
    : _channel = channel ?? _defaultChannel;

  static const _defaultChannel = MethodChannel('app.w3dev.mergerelay/share');

  final MethodChannel _channel;

  @override
  Future<MergeRelayShareStatus> share(MergeRelaySharePayload payload) async {
    try {
      final value = await _channel.invokeMethod<Object?>('share', {
        'title': 'Merge Relay',
        'message': payload.message,
      });
      return _statusFromPlatform(value);
    } on MissingPluginException {
      return MergeRelayShareStatus.unavailable;
    } on PlatformException catch (error) {
      return error.code == 'share_unavailable'
          ? MergeRelayShareStatus.unavailable
          : MergeRelayShareStatus.failed;
    } on Object {
      return MergeRelayShareStatus.failed;
    }
  }

  static MergeRelayShareStatus _statusFromPlatform(Object? value) {
    if (value is! Map) return MergeRelayShareStatus.failed;
    final status = value['status'];
    return switch (status) {
      'opened' => MergeRelayShareStatus.opened,
      'unavailable' => MergeRelayShareStatus.unavailable,
      'failed' => MergeRelayShareStatus.failed,
      _ => MergeRelayShareStatus.failed,
    };
  }
}

final class UnavailableMergeRelayShareProvider
    implements MergeRelayShareProvider {
  const UnavailableMergeRelayShareProvider();

  @override
  Future<MergeRelayShareStatus> share(MergeRelaySharePayload payload) async =>
      MergeRelayShareStatus.unavailable;
}
