/// Opens [DailyRewardScreen] (task 26h) from the lobby with the shared
/// [LudoDailyRewardState] the lobby badge also reads.
library;

import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';

import '../net/ludo_ads.dart';
import '../net/ludo_ads_service.dart';
import '../net/ludo_online_client.dart';
import '../net/ludo_online_preview_mode.dart' show LudoOnlinePreviewMode;
import '../net/ludo_preview_rewards.dart' show PreviewServerCreditAdSdk;
import '../state/ludo_daily_reward_state.dart';
import '../state/ludo_rewarded_ads_state.dart';
import '../state/ludo_wallet_state.dart';
import '../state/reduced_motion_setting.dart';
import 'daily_reward_screen.dart';

/// The ads service the rewards screen uses. In the armed debug online
/// preview there is no real backend to verify an ad, so a decorator makes the
/// preview server credit the reward after a genuinely watched test ad; every
/// other build uses [ludoAds] unchanged.
LudoAdsService resolveRewardsAdsService() {
  final ads = ludoAds;
  if (kDebugMode && LudoOnlinePreviewMode.isArmed) {
    return LudoAdsService(
      sdk: PreviewServerCreditAdSdk(ads.sdk),
      config: ads.config,
    );
  }
  return ads;
}

Future<void> openLudoDailyRewards(
  BuildContext context, {
  required LudoOnlineClient onlineClient,
  required LudoWalletState walletState,
  required LudoDailyRewardState dailyReward,
  ReducedMotionSetting? reducedMotion,
  LudoAdsService? adsService,
}) async {
  final ads = LudoRewardedAdsState(
    gateway: onlineClient.gateway,
    authController: onlineClient.authController,
    walletState: walletState,
    ads: adsService ?? resolveRewardsAdsService(),
  );
  await Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => DailyRewardScreen(
        dailyReward: dailyReward,
        ads: ads,
        walletState: walletState,
        reducedMotion: reducedMotion,
      ),
    ),
  );
  // The calendar may have changed (claimed) while the screen was open.
  await dailyReward.load();
}
