/// The physical Ludo board: a 52-square shared track plus a private
/// 6-square home stretch per color. This geometry is frozen and shared by
/// every [LudoRuleset] (see `ludo_config.dart`) — only the *distance* a
/// token must travel before turning into its home stretch varies between
/// Classic and Quick.
///
/// Re-derived from Ludo King's standard board layout, NOT copied from the
/// Unity fixture (`apps-native/unity/ludo/Assets/Content/ludo_v1.json`),
/// which is explicitly marked as "not assumed to be universal Ludo rules"
/// and includes blockades that this engine does not implement:
///
/// - 52 common-track squares, indices `0..51`.
/// - 4 colors with start squares spaced evenly 13 squares apart:
///   red = 0, green = 13, yellow = 26, blue = 39.
/// - 8 safe squares total: each color's start square, plus one "star"
///   square 8 squares ahead of each start (8, 21, 34, 47) — the standard
///   Ludo star-square layout. No capture can happen on a safe square.
library;

import 'ludo_config.dart';

/// Number of squares on the shared track that every match plays on,
/// regardless of ruleset.
const ludoTrackLength = 52;

/// A player's board color, which fixes their start square and the absolute
/// track cells their path positions map to.
enum LudoColor { red, green, yellow, blue }

const _startIndexByColor = {
  LudoColor.red: 0,
  LudoColor.green: 13,
  LudoColor.yellow: 26,
  LudoColor.blue: 39,
};

const _starOffsetFromStart = 8;

/// Pure geometry queries against the frozen board layout described above.
/// Holds no match state.
final class LudoBoard {
  const LudoBoard();

  /// The absolute track cell (`0..51`) where [color]'s players start and
  /// exit the yard onto.
  int startIndexOf(LudoColor color) => _startIndexByColor[color]!;

  /// The absolute track cell (`0..51`) a token of [color] occupies while at
  /// shared-track [pathPosition]. Only meaningful while
  /// `isOnSharedTrack(ruleset, pathPosition)` is true — once a token has
  /// turned into its private home stretch it no longer occupies a shared
  /// cell and this mapping does not apply.
  int absoluteCellOf(LudoColor color, int pathPosition) {
    if (pathPosition < 0) {
      throw ArgumentError.value(pathPosition, 'pathPosition');
    }
    return (startIndexOf(color) + pathPosition) % ludoTrackLength;
  }

  /// Whether absolute track [cell] is a safe square (a start square or a
  /// star square): no capture can happen there.
  bool isSafeCell(int cell) {
    for (final start in _startIndexByColor.values) {
      final starCell = (start + _starOffsetFromStart) % ludoTrackLength;
      if (cell == start || cell == starCell) return true;
    }
    return false;
  }

  /// Whether a token at [pathPosition] under [ruleset] is still on the
  /// shared track (as opposed to already in its private home stretch, or
  /// still in the yard).
  bool isOnSharedTrack(LudoRuleset ruleset, int pathPosition) =>
      pathPosition >= 0 && pathPosition < ruleset.stepsToHomeEntry;

  /// All safe absolute cells, for tests/inspection.
  static List<int> get safeCells {
    final cells = <int>{};
    for (final start in _startIndexByColor.values) {
      cells.add(start);
      cells.add((start + _starOffsetFromStart) % ludoTrackLength);
    }
    final sorted = cells.toList()..sort();
    return List.unmodifiable(sorted);
  }
}
