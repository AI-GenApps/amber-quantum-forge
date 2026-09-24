/// Pure geometry for laying the Ludo board out on a 15x15 grid.
///
/// This maps `ludo_rules`' abstract indices (absolute track cell `0..51`,
/// per-color home-stretch cell `0..5`, per-color yard) onto grid
/// coordinates `(row, col)` in `0..14`, and grid coordinates onto pixel
/// offsets given a board size. Nothing here draws anything — see
/// `ludo_board_component.dart` and `ludo_token_component.dart` for the
/// code-drawn rendering that consumes this geometry.
///
/// The 52-cell track walks a cross shape with 4-fold rotational symmetry
/// (each color's arm is the previous color's arm rotated 90 degrees about
/// the board center), which keeps the four quadrants visually identical
/// apart from color, matching the standard Ludo board layout referenced in
/// `.agents/resources/2026-09-19/ludo-reference/study.md` without copying
/// any captured screenshot.
library;

import 'dart:ui';

import 'package:ludo_rules/ludo_rules.dart';

/// The single source of truth for each color's base paint color, reused by
/// the board (yard/home-stretch tinting), the token painter, and the art
/// manifest so every slot agrees on one palette.
const Map<LudoColor, Color> ludoColorPalette = {
  LudoColor.red: Color(0xFFE53935),
  LudoColor.green: Color(0xFF43A047),
  LudoColor.yellow: Color(0xFFFDD835),
  LudoColor.blue: Color(0xFF1E88E5),
};

/// Number of grid cells per side of the square board.
const ludoGridSize = 15;

/// One color's home-stretch lane, edge cell first (index 0) and the cell
/// nearest the center last (index 5), matching `ludo_rules`' per-color
/// home-stretch cell numbering (`pathPosition - ruleset.stepsToHomeEntry`).
const Map<LudoColor, List<(int, int)>> _homeStretchByColor = {
  LudoColor.red: [(7, 1), (7, 2), (7, 3), (7, 4), (7, 5), (7, 6)],
  LudoColor.green: [(1, 7), (2, 7), (3, 7), (4, 7), (5, 7), (6, 7)],
  LudoColor.yellow: [(7, 13), (7, 12), (7, 11), (7, 10), (7, 9), (7, 8)],
  LudoColor.blue: [(13, 7), (12, 7), (11, 7), (10, 7), (9, 7), (8, 7)],
};

/// The four yard token-slot positions per color, inside that color's 6x6
/// corner region.
const Map<LudoColor, List<(int, int)>> _yardSlotsByColor = {
  LudoColor.red: [(1, 1), (1, 4), (4, 1), (4, 4)],
  LudoColor.green: [(1, 10), (1, 13), (4, 10), (4, 13)],
  LudoColor.yellow: [(10, 10), (10, 13), (13, 10), (13, 13)],
  LudoColor.blue: [(10, 1), (10, 4), (13, 1), (13, 4)],
};

/// The top-left corner `(row, col)` of each color's 6x6 yard region, for
/// drawing the yard background and the turn-highlight border.
const Map<LudoColor, (int, int)> ludoYardCorner = {
  LudoColor.red: (0, 0),
  LudoColor.green: (0, 9),
  LudoColor.yellow: (9, 9),
  LudoColor.blue: (9, 0),
};

const _board = LudoBoard();

/// Grid coordinates for every absolute track cell `0..51`, generated once
/// by walking the cross-shaped path. Index `i` is the `(row, col)` of
/// absolute track cell `i`.
final List<(int, int)> ludoTrackCellGrid = List.unmodifiable(
  _buildTrackCellGrid(),
);

List<(int, int)> _buildTrackCellGrid() {
  // The west arm's outer edge (row 6, moving away from the yard) followed
  // by the west arm's far column (col 6, moving up), then the analogous
  // sequence rotated 90 degrees three more times, produces the full
  // 52-cell loop with the 4-fold symmetry described above.
  final quarter = <(int, int)>[
    (6, 1),
    (6, 2),
    (6, 3),
    (6, 4),
    (6, 5),
    (5, 6),
    (4, 6),
    (3, 6),
    (2, 6),
    (1, 6),
    (0, 6),
    (0, 7),
    (0, 8),
  ];
  final cells = <(int, int)>[];
  for (var turn = 0; turn < 4; turn++) {
    for (final (row, col) in quarter) {
      cells.add(_rotate90((row, col), turn));
    }
  }
  return cells;
}

/// Rotates `(row, col)` 90 degrees clockwise about the 15x15 grid center,
/// applied `times` times.
(int, int) _rotate90((int, int) cell, int times) {
  var (row, col) = cell;
  for (var i = 0; i < times; i++) {
    final nextRow = col;
    final nextCol = (ludoGridSize - 1) - row;
    row = nextRow;
    col = nextCol;
  }
  return (row, col);
}

/// The `(row, col)` of a color's start square, derived from `ludo_rules`'
/// [LudoBoard.startIndexOf] so this geometry always agrees with the rules
/// engine about which absolute cell each color starts on.
(int, int) ludoStartCellGrid(LudoColor color) =>
    ludoTrackCellGrid[_board.startIndexOf(color)];

/// The `(row, col)` of a color's home-stretch cell `stretchIndex` (`0..5`).
(int, int) ludoHomeStretchCellGrid(LudoColor color, int stretchIndex) =>
    _homeStretchByColor[color]![stretchIndex];

/// The `(row, col)` of yard slot `slotIndex` (`0..3`) for [color].
(int, int) ludoYardSlotGrid(LudoColor color, int slotIndex) =>
    _yardSlotsByColor[color]![slotIndex];

/// Whether absolute track cell [cell] is a safe cell, per `ludo_rules`.
bool ludoIsSafeCell(int cell) => _board.isSafeCell(cell);

/// Converts a grid cell to the pixel-space square it occupies, given the
/// board draws into [boardRect].
Rect ludoCellRectAt((int, int) gridCell, Rect boardRect) {
  final cellSize = boardRect.width / ludoGridSize;
  final (row, col) = gridCell;
  return Rect.fromLTWH(
    boardRect.left + col * cellSize,
    boardRect.top + row * cellSize,
    cellSize,
    cellSize,
  );
}

/// The pixel-space center of a grid cell, given the board draws into
/// [boardRect].
Offset ludoCellCenterAt((int, int) gridCell, Rect boardRect) =>
    ludoCellRectAt(gridCell, boardRect).center;
