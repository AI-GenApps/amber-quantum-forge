import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  final forbidden = <RegExp>[
    RegExp(r'submitScore', caseSensitive: false),
    RegExp(r'\.unlock\s*\(', caseSensitive: false),
    RegExp(r'unlockAchievement', caseSensitive: false),
    RegExp(r'incrementAchievement', caseSensitive: false),
    RegExp(r'setSteps', caseSensitive: false),
    RegExp(r'revealAchievement', caseSensitive: false),
  ];

  List<File> sources(String root, String extension) => Directory(root)
      .listSync(recursive: true)
      .whereType<File>()
      .where((file) => file.path.endsWith(extension))
      .toList();

  void expectClean(File file) {
    final text = file.readAsStringSync();
    for (final pattern in forbidden) {
      expect(
        pattern.hasMatch(text),
        isFalse,
        reason: '${file.path} matches ${pattern.pattern}',
      );
    }
  }

  test('Dart client never submits scores or unlocks achievements', () {
    final files = sources('lib', '.dart');
    expect(files, isNotEmpty);
    files.forEach(expectClean);
  });

  test('Android bridge only opens provider UI and never writes progress', () {
    final bridge = sources(
      'android/app/src/main',
      '.kt',
    ).where((file) => file.path.contains('PlayGames')).toList();
    expect(bridge, isNotEmpty);
    bridge.forEach(expectClean);
  });

  test('Android bridge exposes no profile fields', () {
    for (final file in sources('android/app/src/main', '.kt')) {
      if (!file.path.contains('PlayGames')) continue;
      final text = file.readAsStringSync();
      expect(
        RegExp(r'getEmail|\.email\b|displayName').hasMatch(text),
        isFalse,
        reason: file.path,
      );
    }
  });
}
