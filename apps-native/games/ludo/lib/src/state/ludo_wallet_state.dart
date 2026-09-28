/// Cached wallet/progression state (task 26e): coins, diamonds, level, xp
/// and xp-required-for-next-level, refreshed from task 26b's `wallet`/
/// `profile` routes via [LudoGateway] on app foreground/lobby entry.
///
/// Read-only when offline: a failed [refresh] (no network, an unavailable
/// auth controller, or a decoded [LudoApiException]/[LudoProtocolException])
/// leaves the last-synced snapshot in place and flips [isOffline], per
/// research.md section 4's "what must work offline" guidance and task 24's
/// guarded-Firebase pattern — this never throws out of [refresh]; callers
/// observe [isOffline] instead of catching.
library;

import 'package:flutter/foundation.dart';

import '../net/ludo_auth_controller.dart';
import '../net/ludo_gateway.dart';

/// The wallet/progression snapshot [LudoWalletState] caches, read by the
/// HUD chips and the profile/settings surface.
class LudoWalletState extends ChangeNotifier {
  LudoWalletState({required this.gateway, required this.authController});

  final LudoGateway gateway;
  final LudoAuthController authController;

  int _coins = 0;
  int _diamonds = 0;
  int _level = 1;
  int _xp = 0;
  int _xpRequiredForNextLevel = 100;
  bool _isOffline = false;
  bool _hasSynced = false;

  int get coins => _coins;
  int get diamonds => _diamonds;
  int get level => _level;
  int get xp => _xp;
  int get xpRequiredForNextLevel => _xpRequiredForNextLevel;

  /// The XP bar's fraction filled toward the next level, `0.0`-`1.0`.
  double get xpProgress => _xpRequiredForNextLevel <= 0
      ? 0
      : (_xp / _xpRequiredForNextLevel).clamp(0, 1).toDouble();

  /// `true` once [refresh] has succeeded at least once this session, so
  /// callers can distinguish "never synced" (show a placeholder) from
  /// "synced, then went offline" (show the last-known snapshot).
  bool get hasSynced => _hasSynced;

  /// `true` if the most recent [refresh] could not reach the server. The
  /// cached snapshot above is left unchanged, so HUD chips keep showing
  /// the last-synced values rather than blanking out.
  bool get isOffline => _isOffline;

  /// Refreshes the cached snapshot from `GET wallet` and `GET profile`.
  /// Never throws: a failure (network, auth, or protocol) only sets
  /// [isOffline] and leaves the previous snapshot in place.
  Future<void> refresh() async {
    try {
      final gameToken = await authController.ensureGameToken();
      final wallet = await gateway.getWallet(gameToken: gameToken);
      final profile = await gateway.getProfile(gameToken: gameToken);
      _coins = wallet.coins;
      _diamonds = wallet.diamonds;
      _level = profile.level;
      _xp = profile.xp;
      _xpRequiredForNextLevel = profile.xpRequiredForNextLevel;
      _isOffline = false;
      _hasSynced = true;
    } on Object {
      _isOffline = true;
    }
    notifyListeners();
  }

  /// Applies a wallet delta already confirmed by the server (e.g. a
  /// starter-grant or daily-reward-claim response) without a round trip.
  void applyWalletSnapshot({required int coins, required int diamonds}) {
    _coins = coins;
    _diamonds = diamonds;
    notifyListeners();
  }

  /// Applies an `xp/claim` result (from [LudoOfflineXpQueue.flush] or a
  /// direct online claim) onto the cached progression.
  void applyXpClaimResult(LudoXpClaimResult result) {
    _xp = result.xp;
    _level = result.level;
    _xpRequiredForNextLevel = result.xpRequiredForNextLevel;
    notifyListeners();
  }
}
