import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';

/// The generated identity for this app (public title, save/telemetry
/// namespaces, environment). Backed by the `games:codegen`-generated Dart
/// registry, never hardcoded.
final ludoIdentity = appIdentityFor(
  'ludo',
  subtitle: 'Roll, race, and capture',
);

/// Root widget for the Ludo client.
///
/// This is a scaffold: it only proves the app boots offline (no Firebase or
/// network dependency exists anywhere in this app yet) and shows a
/// placeholder home screen. Real screens, board rendering, and game state
/// arrive in later Ludo tasks; this widget and its routing are the
/// integration point they will build on.
final class LudoApp extends StatelessWidget {
  const LudoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: ludoIdentity.publicTitle,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(colorSchemeSeed: Colors.indigo, useMaterial3: true),
      home: const LudoPlaceholderHomeScreen(),
    );
  }
}

/// Placeholder home screen shown until the real home lobby (later Ludo
/// tasks) replaces it. Renders no network/Firebase calls.
final class LudoPlaceholderHomeScreen extends StatelessWidget {
  const LudoPlaceholderHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              ludoIdentity.publicTitle,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              ludoIdentity.subtitle,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }
}
