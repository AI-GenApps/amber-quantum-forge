/// Resolves the production online-play dependency graph (task 26): the
/// gateway, auth controller and online controller `home_lobby_screen.dart`
/// needs to enable the Play-with-Friends/Online tiles, mirroring
/// `merge_relay`'s `createMergeRelayClient`/`mergeRelayClientConfig`
/// pattern (`apps-native/games/merge_relay/lib/src/merge_relay_client.dart`)
/// for how a game resolves its own base URL from a build-time
/// `--dart-define`.
///
/// [createLudoOnlineClient] returns `null` whenever online play isn't
/// actually available — no `LUDO_API_BASE_URL` configured at build time,
/// *or* Firebase failed to initialize (no `google-services.json`/
/// `GoogleService-Info.plist`) — so a config-absent build degrades to the
/// exact same "tiles disabled" lobby state task 08/24 already established,
/// per this task's Context/Decisions.
library;

import 'package:platform_core/platform_core.dart'
    show AppContext, AppEnvironment, runtimeAppContext;

import '../app.dart' show ludoIdentity;
import '../telemetry/ludo_telemetry.dart';
import 'ludo_auth_controller.dart';
import 'ludo_firebase_gateway.dart';
import 'ludo_gateway.dart';
import 'ludo_http.dart';
import 'ludo_online_controller.dart';

/// Build-time API base URL, e.g. `--dart-define=LUDO_API_BASE_URL=https://
/// example.com`. Empty (the default) when not supplied, which
/// [createLudoOnlineClient] treats as "online not configured" rather than
/// an error.
const ludoApiBaseUrl = String.fromEnvironment('LUDO_API_BASE_URL');

/// Everything `home_lobby_screen.dart`'s online flows need.
final class LudoOnlineClient {
  const LudoOnlineClient({
    required this.gateway,
    required this.authController,
    required this.onlineController,
  });

  final LudoGateway gateway;
  final LudoAuthController authController;
  final LudoOnlineController onlineController;
}

/// Parses and validates [apiBaseUrl] the same way
/// `mergeRelayClientConfig` validates its own: a non-empty `http`/`https`
/// URL with no userinfo/query/fragment. Returns `null` for anything else
/// (unset, malformed, wrong scheme).
Uri? resolveLudoApiBaseUri({String apiBaseUrl = ludoApiBaseUrl}) {
  final uri = Uri.tryParse(apiBaseUrl.trim());
  if (uri == null ||
      uri.host.isEmpty ||
      uri.userInfo.isNotEmpty ||
      uri.query.isNotEmpty ||
      uri.fragment.isNotEmpty ||
      !{'http', 'https'}.contains(uri.scheme)) {
    return null;
  }
  return uri;
}

/// Resolves the production [LudoOnlineClient], or `null` if online play
/// isn't available in this build (see this library's doc comment). Never
/// throws — any construction failure (a malformed base URL slipping past
/// validation, an unexpected plugin error) degrades to `null` exactly like
/// a missing config does, so a caller never needs a second error path.
Future<LudoOnlineClient?> createLudoOnlineClient(AppContext context) async {
  final firebaseAvailable = await ensureLudoFirebaseInitialized();
  if (!firebaseAvailable) return null;
  final apiBaseUri = resolveLudoApiBaseUri();
  if (apiBaseUri == null) return null;
  try {
    final config = LudoNetworkConfig(
      apiBaseUri: apiBaseUri,
      environment: context.environment.name,
      allowInsecureLocalDebug: context.environment == AppEnvironment.debug,
    );
    final gateway = LudoGateway(
      config: config,
      transport: DartIoLudoHttpTransport(),
    );
    final authController = LudoAuthController(
      gateway: gateway,
      firebaseAuth: FirebaseLudoAuthGateway(),
      googleSignIn: GoogleSignInLudoGateway(),
    );
    final onlineController = LudoOnlineController(
      gateway: gateway,
      authController: authController,
      telemetry: LudoTelemetry(context: context),
    );
    return LudoOnlineClient(
      gateway: gateway,
      authController: authController,
      onlineController: onlineController,
    );
  } on Object {
    return null;
  }
}

/// Convenience for a call site that has no [AppContext] handy — resolves a
/// fresh production one via `runtimeAppContext`, matching
/// `ludo_telemetry.dart`'s own default (`LudoTelemetry()`'s constructor).
Future<LudoOnlineClient?> createLudoOnlineClientForApp() {
  return createLudoOnlineClient(runtimeAppContext(identity: ludoIdentity));
}
