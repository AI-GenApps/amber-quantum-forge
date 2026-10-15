/// Daily reward calendar state (task 26h): the server's calendar read model
/// plus the claim action. The server decides the streak day, the amounts and
/// any Vortex Pass bonus; this class only loads and renders them, and applies
/// the server-confirmed balances to the shared wallet. It never throws:
/// failures surface as [isOffline] or [errorMessage].
library;

import 'package:flutter/foundation.dart';

import '../net/ludo_auth_controller.dart';
import '../net/ludo_gateway.dart';
import '../net/ludo_rewards_models.dart';
import '../net/ludo_wire_json.dart';
import 'ludo_wallet_state.dart';

class LudoDailyRewardState extends ChangeNotifier {
  LudoDailyRewardState({
    required this.gateway,
    required this.authController,
    required this.walletState,
  });

  final LudoGateway gateway;
  final LudoAuthController authController;
  final LudoWalletState walletState;

  LudoDailyRewardStatus? _status;
  LudoDailyRewardClaimResult? _lastClaim;
  bool _loading = false;
  bool _claiming = false;
  bool _isOffline = false;
  String? _errorMessage;

  /// The latest server read model, `null` until a [load] succeeds.
  LudoDailyRewardStatus? get status => _status;

  /// The result of the claim made in this session, if any.
  LudoDailyRewardClaimResult? get lastClaim => _lastClaim;
  bool get isLoading => _loading;
  bool get isClaiming => _claiming;

  /// `true` when the latest [load] or [claim] could not reach the server.
  bool get isOffline => _isOffline;
  String? get errorMessage => _errorMessage;

  /// `true` when a claim is available right now (drives the lobby badge).
  bool get isClaimable {
    final status = _status;
    return status != null && !status.claimedToday;
  }

  Future<void> load() async {
    if (_loading) return;
    _loading = true;
    notifyListeners();
    try {
      final token = await authController.ensureGameToken();
      _status = await gateway.getDailyRewardStatus(gameToken: token);
      _isOffline = false;
    } on Object {
      _isOffline = true;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  /// Claims today's reward. Returns `true` only when the server granted it.
  Future<bool> claim() async {
    if (_claiming || !isClaimable) return false;
    _claiming = true;
    _errorMessage = null;
    notifyListeners();
    try {
      final token = await authController.ensureGameToken();
      final result = await gateway.claimDailyReward(gameToken: token);
      _lastClaim = result;
      walletState.applyWalletSnapshot(
        coins: result.coins,
        diamonds: result.diamonds,
      );
      _isOffline = false;
      _claiming = false;
      await load();
      return true;
    } on LudoApiException catch (error) {
      if (error.code == 'ludo_daily_reward_already_claimed') {
        _errorMessage = 'You already claimed today. Come back tomorrow.';
        _claiming = false;
        await load();
        return false;
      }
      _errorMessage = 'Could not claim your reward. Please try again.';
      return false;
    } on Object {
      _isOffline = true;
      _errorMessage = 'You are offline. Connect to claim your reward.';
      return false;
    } finally {
      _claiming = false;
      notifyListeners();
    }
  }
}
