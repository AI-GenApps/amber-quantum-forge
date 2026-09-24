import 'package:ludo_rules/ludo_rules.dart';
import 'package:test/test.dart';

void main() {
  const board = LudoBoard();

  test('start indices are spaced 13 apart in enum order', () {
    expect(board.startIndexOf(LudoColor.red), 0);
    expect(board.startIndexOf(LudoColor.green), 13);
    expect(board.startIndexOf(LudoColor.yellow), 26);
    expect(board.startIndexOf(LudoColor.blue), 39);
  });

  test('absoluteCellOf wraps around the 52-square track', () {
    expect(board.absoluteCellOf(LudoColor.red, 0), 0);
    expect(board.absoluteCellOf(LudoColor.red, 51), 51);
    expect(board.absoluteCellOf(LudoColor.green, 0), 13);
    expect(board.absoluteCellOf(LudoColor.blue, 20), (39 + 20) % 52);
  });

  test('safe cells are exactly the 8 start/star squares', () {
    expect(LudoBoard.safeCells, [0, 8, 13, 21, 26, 34, 39, 47]);
    for (final cell in LudoBoard.safeCells) {
      expect(
        board.isSafeCell(cell),
        isTrue,
        reason: 'cell $cell should be safe',
      );
    }
  });

  test('non-safe cells are not flagged safe', () {
    for (final cell in [1, 5, 10, 20, 30, 40, 50]) {
      expect(
        board.isSafeCell(cell),
        isFalse,
        reason: 'cell $cell should not be safe',
      );
    }
  });

  test('isOnSharedTrack respects the ruleset entry distance', () {
    // Since task 12g, Quick shares Classic's full-length track (see
    // `ludo_config.dart`'s `LudoRuleset.quick`), so both rulesets agree on
    // where the shared track ends and the private home stretch begins.
    expect(board.isOnSharedTrack(LudoRuleset.classic, 0), isTrue);
    expect(board.isOnSharedTrack(LudoRuleset.classic, 50), isTrue);
    expect(board.isOnSharedTrack(LudoRuleset.classic, 51), isFalse);
    expect(board.isOnSharedTrack(LudoRuleset.quick, 50), isTrue);
    expect(board.isOnSharedTrack(LudoRuleset.quick, 51), isFalse);
  });
}
