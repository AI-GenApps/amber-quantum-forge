import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

import 'core/config/app_config.dart';
import 'features/app/force_update_gate.dart';
import 'features/home/home_screen.dart';
import 'features/onboarding/onboarding_screen.dart';

/// Entry point. Mirrors
/// `apps-native/ios-app/Starter/StarterApp.swift`: configure Firebase
/// and RevenueCat before the first frame, then route to onboarding or
/// home depending on whether onboarding has already been completed.
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp();

  if (AppConfig.revenueCatApiKey.isNotEmpty) {
    await Purchases.configure(
      PurchasesConfiguration(AppConfig.revenueCatApiKey),
    );
  }

  final onboardingComplete = await isOnboardingComplete();

  runApp(
    ProviderScope(
      child: StarterApp(initialOnboardingComplete: onboardingComplete),
    ),
  );
}

class StarterApp extends StatefulWidget {
  const StarterApp({super.key, required this.initialOnboardingComplete});

  final bool initialOnboardingComplete;

  @override
  State<StarterApp> createState() => _StarterAppState();
}

class _StarterAppState extends State<StarterApp> {
  late bool _onboardingComplete = widget.initialOnboardingComplete;

  void _handleOnboardingComplete() {
    setState(() => _onboardingComplete = true);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Starter',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.indigo),
      home: _onboardingComplete
          ? const ForceUpdateGate(child: HomeScreen())
          : OnboardingScreen(onComplete: _handleOnboardingComplete),
    );
  }
}
