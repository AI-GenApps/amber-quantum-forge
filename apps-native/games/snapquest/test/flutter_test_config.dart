/// Loads the app's bundled fonts — plus the Material Icons glyph font from
/// the Flutter SDK — before any test runs, so goldens capture real glyphs
/// instead of tofu/fallback boxes (task 03/04).
///
/// `flutter_test` picks this file up automatically for every test file
/// under `test/` — no per-file import needed — because its `main()`
/// delegates to [testExecutable] as its `testMain` argument.
///
/// `golden_toolkit` is not a dependency of this package, so fonts are
/// registered directly via [FontLoader]: the app's own fonts from asset
/// bytes (matching the family names registered in `pubspec.yaml`), and
/// Material Icons by reading the `.otf` straight off disk from the
/// Flutter SDK's cache (it isn't a pub asset, so `rootBundle` can't load
/// it) — without it, every `Icon` in a golden renders as an empty box.
library;

import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart' show ByteData, FontLoader, rootBundle;
import 'package:flutter_test/flutter_test.dart';

/// Font family name -> asset path(s), matching `pubspec.yaml`'s `fonts:`
/// registrations exactly.
const Map<String, List<String>> _bundledFonts = {
  'Baloo2': ['assets/fonts/Baloo2/Baloo2-Variable.ttf'],
  'Andika': [
    'assets/fonts/Andika/Andika-Regular.ttf',
    'assets/fonts/Andika/Andika-Bold.ttf',
    'assets/fonts/Andika/Andika-Italic.ttf',
    'assets/fonts/Andika/Andika-BoldItalic.ttf',
  ],
};

/// Path to the Material Icons font inside the Flutter SDK's cache,
/// relative to `$FLUTTER_ROOT`. Resolved robustly: prefer `$FLUTTER_ROOT`
/// (as the task's required environment prefix sets it), falling back to
/// this server's fixed SDK install location if the env var isn't set.
const String _materialIconsRelativePath =
    'bin/cache/artifacts/material_fonts/MaterialIcons-Regular.otf';
const String _fallbackFlutterRoot = '/data/tools/flutter';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();
  await _loadAppFonts();
  await _loadMaterialIconsFont();
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

Future<void> _loadMaterialIconsFont() async {
  final flutterRoot = Platform.environment['FLUTTER_ROOT'];
  final candidateRoots = <String>[
    if (flutterRoot != null && flutterRoot.isNotEmpty) flutterRoot,
    _fallbackFlutterRoot,
  ];
  for (final root in candidateRoots) {
    final file = File('$root/$_materialIconsRelativePath');
    if (file.existsSync()) {
      final bytes = await file.readAsBytes();
      final loader = FontLoader('MaterialIcons')
        ..addFont(Future.value(ByteData.sublistView(bytes)));
      await loader.load();
      return;
    }
  }
  // If the SDK cache isn't where expected, icons fall back to tofu boxes
  // in goldens rather than failing the whole suite — the app-font check
  // above (the actual point of this task) still runs.
}
