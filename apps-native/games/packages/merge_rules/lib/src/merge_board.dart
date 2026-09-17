enum MergeDirection { up, down, left, right }

final class MergeBoard {
  MergeBoard(Iterable<int> values) : cells = List.unmodifiable(values) {
    if (cells.length != 16) {
      throw ArgumentError.value(cells.length, 'values', 'A board has 16 cells');
    }
    if (cells.any(
      (value) =>
          value < 0 ||
          value > maxMergeTile ||
          (value != 0 && !_isPowerOfTwo(value)),
    )) {
      throw ArgumentError.value(
        values,
        'values',
        'Tiles must be zero or powers of two',
      );
    }
  }

  factory MergeBoard.empty() => MergeBoard(List.filled(16, 0));

  final List<int> cells;

  int at(int row, int column) => cells[row * 4 + column];

  bool get isFull => cells.every((value) => value != 0);

  bool get hasLegalMove {
    if (!isFull) return true;
    for (var row = 0; row < 4; row += 1) {
      for (var column = 0; column < 4; column += 1) {
        final value = at(row, column);
        if (row < 3 && value == at(row + 1, column)) return true;
        if (column < 3 && value == at(row, column + 1)) return true;
      }
    }
    return false;
  }

  MergeBoard withCells(Iterable<int> values) => MergeBoard(values);

  static bool _isPowerOfTwo(int value) =>
      value > 0 && (value & (value - 1)) == 0;
}

const maxMergeTile = 1 << 30;
