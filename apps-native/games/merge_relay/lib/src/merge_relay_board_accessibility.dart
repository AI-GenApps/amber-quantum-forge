import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:merge_rules/merge_rules.dart';

Widget mergeRelayAccessibleBoard({
  required MergeBoard board,
  required Widget child,
  required String label,
  Map<CustomSemanticsAction, VoidCallback> customActions = const {},
}) {
  return Semantics(
    container: true,
    label: label,
    customSemanticsActions: customActions,
    child: Stack(
      fit: StackFit.loose,
      children: [
        child,
        Positioned.fill(
          child: IgnorePointer(
            child: Column(
              children: [
                for (var row = 0; row < 4; row += 1)
                  Expanded(
                    child: Row(
                      children: [
                        for (var column = 0; column < 4; column += 1)
                          Expanded(
                            child: Semantics(
                              container: true,
                              label: mergeRelayCellLabel(board, row, column),
                              child: const SizedBox.expand(),
                            ),
                          ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

String mergeRelayBoardLabel(MergeBoard board, {String prefix = 'Merge board'}) {
  final rows = <String>[];
  for (var row = 0; row < 4; row += 1) {
    final cells = <String>[];
    for (var column = 0; column < 4; column += 1) {
      cells.add(_cellValue(board.at(row, column)));
    }
    rows.add('Row ${row + 1}: ${cells.join(', ')}');
  }
  return '$prefix. ${rows.join('. ')}.';
}

String mergeRelayCellLabel(MergeBoard board, int row, int column) {
  return 'Row ${row + 1}, column ${column + 1}: '
      '${_cellValue(board.at(row, column))}';
}

String _cellValue(int value) => value == 0 ? 'empty' : '$value';
