/// Builds the store's state objects from the resolved online client and
/// opens [StoreScreen] (task 26g).
library;

import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';

import '../net/ludo_online_client.dart';
import '../net/ludo_online_preview_mode.dart' show LudoOnlinePreviewMode;
import '../net/ludo_preview_store.dart' show PreviewLudoPurchasesGateway;
import '../net/ludo_purchases_gateway.dart';
import '../state/ludo_equip_store.dart';
import '../state/ludo_iap_state.dart';
import '../state/ludo_inventory_state.dart';
import '../state/ludo_wallet_state.dart';
import '../state/reduced_motion_setting.dart';
import 'store_screen.dart';

/// Opens the store. With no [onlineClient] (no API URL or Firebase in this
/// build) the screen shows its "Store unavailable" state. RevenueCat
/// resolves through [createLudoPurchasesGateway], which is a no-op gateway
/// when no key was supplied at build time; the armed debug online preview
/// uses a fake gateway that lists offers but never charges.
Future<void> openLudoStore(
  BuildContext context, {
  required LudoOnlineClient? onlineClient,
  required LudoWalletState? walletState,
  ReducedMotionSetting? reducedMotion,
  LudoPurchasesGateway? purchases,
  LudoEquipStore? equipStore,
}) async {
  LudoInventoryState? inventory;
  LudoIapState? iap;
  if (onlineClient != null && walletState != null) {
    final resolvedPurchases =
        purchases ??
        (kDebugMode && LudoOnlinePreviewMode.isArmed
            ? const PreviewLudoPurchasesGateway()
            : await createLudoPurchasesGateway());
    final resolvedEquipStore = equipStore ?? await LudoEquipStore.production();
    inventory = LudoInventoryState(
      gateway: onlineClient.gateway,
      authController: onlineClient.authController,
      walletState: walletState,
      equipStore: resolvedEquipStore,
    );
    iap = LudoIapState(
      purchases: resolvedPurchases,
      gateway: onlineClient.gateway,
      authController: onlineClient.authController,
      walletState: walletState,
      inventoryState: inventory,
    );
  }
  if (!context.mounted) return;
  await Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => StoreScreen(
        walletState: walletState,
        inventory: inventory,
        iap: iap,
        reducedMotion: reducedMotion,
      ),
    ),
  );
}
