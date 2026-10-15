// Shared harness for the task 26g store tests: a real LudoGateway /
// LudoAuthController / LudoWalletState / LudoInventoryState / LudoIapState
// stack over a scripted in-memory transport and fake Firebase and
// RevenueCat gateways — never the network or real plugin channels.
import 'package:ludo/src/net/ludo_auth_controller.dart';
import 'package:ludo/src/net/ludo_firebase_gateway.dart';
import 'package:ludo/src/net/ludo_gateway.dart';
import 'package:ludo/src/net/ludo_http.dart';
import 'package:ludo/src/net/ludo_purchases_gateway.dart';
import 'package:ludo/src/state/ludo_equip_store.dart';
import 'package:ludo/src/state/ludo_iap_state.dart';
import 'package:ludo/src/state/ludo_inventory_state.dart';
import 'package:ludo/src/state/ludo_wallet_state.dart';
import 'package:platform_core/platform_core.dart';

import '../net/ludo_test_support.dart';

final class _FakeUser implements LudoFirebaseUser {
  @override
  String get uid => 'uid-1';

  @override
  bool get isAnonymous => true;

  @override
  Future<String> getIdToken({bool forceRefresh = false}) async => 'id-token';

  @override
  Future<LudoFirebaseUser> linkWithGoogleCredential({
    required String googleIdToken,
    required String googleAccessToken,
  }) async => this;
}

final class _FakeFirebaseAuth implements LudoFirebaseAuthGateway {
  final _user = _FakeUser();

  @override
  LudoFirebaseUser? get currentUser => _user;

  @override
  Future<LudoFirebaseUser> signInAnonymously() async => _user;
}

final class _FakeGoogleSignIn implements LudoGoogleSignInGateway {
  @override
  Future<LudoGoogleSignInResult?> signIn() async => null;
}

/// A transport that replays a queue per route key; the last response for a
/// key repeats, so a GET can be polled any number of times.
final class StoreScriptTransport implements LudoHttpTransport {
  StoreScriptTransport(Map<String, List<LudoHttpResponse>> script)
    : _script = {for (final e in script.entries) e.key: List.of(e.value)};

  final Map<String, List<LudoHttpResponse>> _script;
  final requests = <(String key, Object? body)>[];

  /// Route keys that throw (a dead network) instead of answering.
  final failingKeys = <String>{};

  List<(String, Object?)> requestsFor(String key) => [
    for (final request in requests)
      if (request.$1 == key) request,
  ];

  @override
  Future<LudoHttpResponse> send({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    required Object? body,
    required Duration timeout,
    required int maxRequestBytes,
    required int maxResponseBytes,
  }) async {
    final key = ludoRequestKey(method, uri);
    requests.add((key, body));
    if (failingKeys.contains(key)) throw StateError('network down: $key');
    final queue = _script[key];
    if (queue == null || queue.isEmpty) throw StateError('No fixture for $key');
    return queue.length == 1 ? queue.first : queue.removeAt(0);
  }
}

final class FakePurchasesGateway implements LudoPurchasesGateway {
  FakePurchasesGateway({
    this.available = true,
    this.purchaseStatus = LudoStorePurchaseStatus.success,
    this.restoreOk = true,
    this.packages = const [],
  });

  final bool available;
  LudoStorePurchaseStatus purchaseStatus;
  bool restoreOk;
  List<LudoStorePackage> packages;
  final loggedInAs = <String>[];
  final purchased = <String>[];
  int restoreCalls = 0;

  @override
  bool get isAvailable => available;

  @override
  Future<void> logIn(String appUserId) async => loggedInAs.add(appUserId);

  @override
  Future<List<LudoStorePackage>> getPackages() async => packages;

  @override
  Future<LudoStorePurchaseStatus> purchase(LudoStorePackage package) async {
    purchased.add(package.productId);
    return purchaseStatus;
  }

  @override
  Future<bool> restore() async {
    restoreCalls += 1;
    return restoreOk;
  }
}

LudoEquipStore memoryEquipStore([SaveStore? saveStore]) => LudoEquipStore(
  saveStore: saveStore ?? MemorySaveStore(),
  appContext: AppContext(
    identity: ludoEquipIdentity,
    environment: AppEnvironment.debug,
    appVersion: '0.1.0',
    sessionId: 'test-session',
  ),
);

Map<String, Object?> catalogItem(
  String id,
  String name,
  String type, {
  int? coins,
  int? diamonds,
}) => {
  'item_id': id,
  'display_name': name,
  'item_type': type,
  'price_coins': coins,
  'price_diamonds': diamonds,
};

/// A small catalog covering every tab and ownership state: free defaults,
/// a coin+diamond dice, a coin+diamond token, and a diamond-only board.
Map<String, Object?> inventoryBody({List<String> owned = const []}) => {
  'inventory': [
    for (final id in [
      'dice_default',
      'token_default',
      'board_default',
      ...owned,
    ])
      {
        'item_id': id,
        'item_type': id.split('_').first,
        'acquired_via': 'starter_grant',
        'acquired_at': '2026-01-01T00:00:00.000Z',
      },
  ],
  'catalog': [
    catalogItem('dice_default', 'Default', 'dice'),
    catalogItem('dice_gold', 'Gold', 'dice', coins: 1500, diamonds: 30),
    catalogItem('dice_marble', 'Marble', 'dice', coins: 1500, diamonds: 30),
    catalogItem('token_default', 'Default', 'token'),
    catalogItem('token_gem', 'Gem Tokens', 'token', coins: 2500, diamonds: 50),
    catalogItem('board_default', 'Default', 'board'),
    catalogItem('board_cosmic', 'Cosmic Board', 'board', diamonds: 80),
  ],
  'iap_products': [
    {
      'product_id': 'ludo_coins_small',
      'display_name': 'Coins - Small',
      'kind': 'consumable',
      'grants_coins': 5500,
      'grants_diamonds': null,
    },
    {
      'product_id': 'ludo_vortex_pass_monthly',
      'display_name': 'Vortex Pass (monthly)',
      'kind': 'subscription',
      'grants_coins': null,
      'grants_diamonds': null,
    },
  ],
};

Map<String, Object?> purchaseBody(
  String itemId,
  String type, {
  required int coins,
  required int diamonds,
  bool idempotent = false,
}) => {
  'idempotent': idempotent,
  'item': {
    'item_id': itemId,
    'item_type': type,
    'acquired_via': 'store_purchase',
    'acquired_at': '2026-10-16T00:00:00.000Z',
  },
  'coins': coins,
  'diamonds': diamonds,
};

LudoHttpResponse apiError(String code, int status) => jsonResponse(
  ludoFixtureError(code, statusCode: status),
  statusCode: status,
);

final fakePackages = [
  const LudoStorePackage(
    productId: 'ludo_coins_small',
    title: 'Coins',
    priceString: r'$1.99',
  ),
  const LudoStorePackage(
    productId: 'ludo_vortex_pass_monthly',
    title: 'Pass',
    priceString: r'$3.99',
  ),
];

final class StoreHarness {
  StoreHarness._({
    required this.transport,
    required this.wallet,
    required this.inventory,
    required this.iap,
    required this.purchases,
    required this.saveStore,
    required this.gateway,
    required this.auth,
  });

  final StoreScriptTransport transport;
  final LudoWalletState wallet;
  final LudoInventoryState inventory;
  final LudoIapState iap;
  final FakePurchasesGateway purchases;
  final SaveStore saveStore;
  final LudoGateway gateway;
  final LudoAuthController auth;

  /// A second inventory state over the same save store: a simulated app
  /// restart.
  LudoInventoryState restarted() => LudoInventoryState(
    gateway: gateway,
    authController: auth,
    walletState: wallet,
    equipStore: memoryEquipStore(saveStore),
  );

  static StoreHarness create({
    Map<String, List<LudoHttpResponse>> script = const {},
    FakePurchasesGateway? purchases,
    SaveStore? saveStore,
  }) {
    final transport = StoreScriptTransport({
      'POST api/auth/exchange': [
        jsonResponse({
          'accessToken': 'access-1',
          'refreshToken': 'refresh-1',
          'expiresIn': 21600,
          'tokenType': 'Bearer',
          'user': {'uid': 'uid-1'},
        }),
      ],
      'POST session': [
        jsonResponse({
          'contract_version': 'ludo.v1',
          'game_token': 'game-token-1',
          'app_id': 'ludo',
          'environment': 'debug',
          'subject': 'uid-1',
          'expires_in': 300,
        }),
      ],
      'GET wallet': [
        jsonResponse({'coins': 2000, 'diamonds': 40}),
      ],
      'GET profile': [
        jsonResponse({'level': 1, 'xp': 0, 'xpRequiredForNextLevel': 100}),
      ],
      'GET inventory': [jsonResponse(inventoryBody())],
      ...script,
    });
    final gateway = LudoGateway(
      config: LudoNetworkConfig(
        apiBaseUri: Uri.parse('https://api.example.test/'),
        environment: 'debug',
      ),
      transport: transport,
    );
    final auth = LudoAuthController(
      gateway: gateway,
      firebaseAuth: _FakeFirebaseAuth(),
      googleSignIn: _FakeGoogleSignIn(),
    );
    final wallet = LudoWalletState(gateway: gateway, authController: auth);
    final store = saveStore ?? MemorySaveStore();
    final inventory = LudoInventoryState(
      gateway: gateway,
      authController: auth,
      walletState: wallet,
      equipStore: memoryEquipStore(store),
      purchaseKey: () => 'key-fixed',
    );
    final fakePurchases =
        purchases ?? FakePurchasesGateway(packages: fakePackages);
    final iap = LudoIapState(
      purchases: fakePurchases,
      gateway: gateway,
      authController: auth,
      walletState: wallet,
      inventoryState: inventory,
    );
    return StoreHarness._(
      transport: transport,
      wallet: wallet,
      inventory: inventory,
      iap: iap,
      purchases: fakePurchases,
      saveStore: store,
      gateway: gateway,
      auth: auth,
    );
  }
}
