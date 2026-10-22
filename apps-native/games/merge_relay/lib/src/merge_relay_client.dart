import 'package:platform_core/platform_core.dart';

import 'merge_relay_features.dart';
import 'merge_relay_gateway.dart';
import 'merge_relay_relay_controller.dart';
import 'merge_relay_relay_persistence.dart';
import 'merge_relay_relay_share.dart';
import 'telemetry/merge_relay_event_outbox.dart';
import 'telemetry/merge_relay_outbox_store.dart';

const mergeRelayApiBaseUrl = String.fromEnvironment('MERGE_RELAY_API_BASE_URL');
const mergeRelayPublicOrigin = String.fromEnvironment(
  'MERGE_RELAY_PUBLIC_ORIGIN',
);

final class MergeRelayClientConfig {
  const MergeRelayClientConfig({
    required this.apiBaseUri,
    required this.publicOrigin,
  });

  final Uri apiBaseUri;
  final Uri? publicOrigin;
}

final class MergeRelayClient {
  const MergeRelayClient({
    required this.saveStore,
    required this.controller,
    this.eventOutbox,
  });

  final MergeRelayEventOutbox? eventOutbox;
  final SaveStore saveStore;
  final MergeRelayRelayController controller;
}

/// Builds the HTTP [MergeRelayGateway]. Injectable so tests can prove the
/// factory is never invoked while [MergeRelayFeatures.socialEnabled] is
/// false, without touching the real network transport.
typedef MergeRelayGatewayFactory = MergeRelayGateway Function({
  required MergeRelayNetworkConfig config,
  required MergeRelayHttpTransport transport,
  required MergeRelayAuthStore authStore,
});

MergeRelayGateway _defaultMergeRelayGatewayFactory({
  required MergeRelayNetworkConfig config,
  required MergeRelayHttpTransport transport,
  required MergeRelayAuthStore authStore,
}) => MergeRelayHttpGateway(
  config: config,
  transport: transport,
  authStore: authStore,
);

MergeRelayClient? createMergeRelayClient({
  required AppContext context,
  required SaveStore saveStore,
  MergeRelayFeatures features = const MergeRelayFeatures(),
  MergeRelayGatewayFactory gatewayFactory = _defaultMergeRelayGatewayFactory,
  MergeRelayOutboxStore? outboxStore,
}) {
  if (!features.socialEnabled) return null;
  final clientConfig = mergeRelayClientConfig();
  if (clientConfig == null) return null;
  try {
    final config = MergeRelayNetworkConfig(
      apiBaseUri: clientConfig.apiBaseUri,
      environment: context.environment.name,
      allowInsecureLocalDebug: context.environment == AppEnvironment.debug,
    );
    final authStore = MethodChannelMergeRelayAuthStore();
    final composite = MergeRelayCompositeSaveStore(delegate: saveStore);
    final gateway = gatewayFactory(
      config: config,
      transport: DartIoMergeRelayHttpTransport(),
      authStore: authStore,
    );
    return MergeRelayClient(
      eventOutbox: outboxStore == null
          ? null
          : MergeRelayEventOutbox(
              gateway: gateway,
              store: outboxStore,
              clock: const SystemClock(),
              socialEnabled: features.socialEnabled,
            ),
      saveStore: composite,
      controller: MergeRelayRelayController(
        context: context,
        gateway: gateway,
        authStore: authStore,
        stateStore: composite,
        publicOrigin: clientConfig.publicOrigin,
        shareProvider: MethodChannelMergeRelayShareProvider(),
      ),
    );
  } on Object {
    return null;
  }
}

MergeRelayClientConfig? mergeRelayClientConfig({
  String apiBaseUrl = mergeRelayApiBaseUrl,
  String publicOrigin = mergeRelayPublicOrigin,
}) {
  final apiBaseUri = Uri.tryParse(apiBaseUrl.trim());
  if (apiBaseUri == null ||
      apiBaseUri.host.isEmpty ||
      apiBaseUri.userInfo.isNotEmpty ||
      apiBaseUri.query.isNotEmpty ||
      apiBaseUri.fragment.isNotEmpty ||
      !{'http', 'https'}.contains(apiBaseUri.scheme)) {
    return null;
  }
  final originValue = publicOrigin.trim();
  if (originValue.isEmpty) {
    return MergeRelayClientConfig(apiBaseUri: apiBaseUri, publicOrigin: null);
  }
  final parsedOrigin = Uri.tryParse(originValue);
  if (parsedOrigin == null || !_isValidPublicOrigin(parsedOrigin)) return null;
  return MergeRelayClientConfig(
    apiBaseUri: apiBaseUri,
    publicOrigin: parsedOrigin,
  );
}

bool _isValidPublicOrigin(Uri value) {
  return value.scheme.toLowerCase() == 'https' &&
      value.host.isNotEmpty &&
      value.userInfo.isEmpty &&
      value.query.isEmpty &&
      value.fragment.isEmpty &&
      (value.path.isEmpty || value.path == '/');
}
