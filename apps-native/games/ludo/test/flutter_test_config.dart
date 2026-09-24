/// Loads the app's bundled fonts before any test runs, so goldens capture
/// real glyphs instead of tofu/fallback boxes (task 12b).
///
/// `flutter_test` picks this file up automatically for every test file
/// under `test/` — no per-file import needed — because its `main()`
/// delegates to [testExecutable] as its `testMain` argument.
///
/// `golden_toolkit` is not a dependency of this package, so fonts are
/// registered directly via [FontLoader] from each bundled font's asset
/// bytes, matching the family names registered in `pubspec.yaml`.
library;

import 'dart:async';

import 'package:flutter/services.dart' show ByteData, FontLoader, rootBundle;
import 'package:flutter_test/flutter_test.dart';

/// Font family name -> asset path, matching `pubspec.yaml`'s `fonts:`
/// registrations exactly.
const Map<String, List<String>> _bundledFonts = {
  'LilitaOne': ['assets/fonts/LilitaOne/LilitaOne-Regular.ttf'],
  'Nunito': ['assets/fonts/Nunito/Nunito-VariableFont_wght.ttf'],
};

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  await _loadAppFonts();
  await testMain();
}

Future<void> _loadAppFonts() async {
  for (final entry in _bundledFonts.entries) {
    final loader = FontLoader(entry.key);
    for (final assetPath in entry.value) {
      loader.addFont(_loadFontData(assetPath));
    }
    await loader.load();
  }
}

Future<ByteData> _loadFontData(String assetPath) async {
  return rootBundle.load(assetPath);
}
