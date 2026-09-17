import 'dart:ui';

import 'package:heist_rules/heist_rules.dart';

import 'heist_board_symbols.dart';

final class HeistBoardArt {
  const HeistBoardArt._();
  static void paint(
    Canvas canvas, {
    required Size size,
    required HeistLevel level,
    required List<HeistAction> actions,
    required HeistPoint player,
    required HeistOutcome? outcome,
  }) {
    final bounds = Offset.zero & size;
    canvas.save();
    canvas.clipRect(bounds);
    final paint = Paint()..style = PaintingStyle.fill;
    paint.color = const Color(0xff0d2238);
    canvas.drawRRect(
      RRect.fromRectAndRadius(bounds, const Radius.circular(26)),
      paint,
    );
    final side = bounds.shortestSide * 0.94;
    final left = (bounds.width - side) / 2;
    final top = (bounds.height - side) / 2;
    final board = Rect.fromLTWH(left, top, side, side);
    final cell = side / 6;
    paint.color = const Color(0xff132f49);
    canvas.drawRRect(
      RRect.fromRectAndRadius(board, const Radius.circular(18)),
      paint,
    );
    _paintGrid(canvas, board, cell, paint, level.walkable);
    _paintCamera(canvas, level, board, cell, paint);
    _paintGuardRoute(canvas, level, board, cell, paint);
    _paintLaser(canvas, level, board, cell, paint);
    _paintRoute(canvas, level, actions, board, cell, paint);
    HeistBoardSymbols.paintGoal(
      canvas,
      level.loot,
      board,
      cell,
      paint,
      const Color(0xffffc857),
      'LOOT',
    );
    HeistBoardSymbols.paintGoal(
      canvas,
      level.exit,
      board,
      cell,
      paint,
      const Color(0xff9be3d5),
      'EXIT',
    );
    HeistBoardSymbols.paintPlayer(canvas, player, board, cell, paint);
    final hasHazard =
        outcome?.trace.any((event) => event.hazard != null) == true;
    if (hasHazard) {
      paint
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5
        ..color = const Color(0xfff26f5b);
      canvas.drawCircle(
        HeistBoardSymbols.centerFor(board, cell, outcome!.player),
        cell * 0.36,
        paint,
      );
      paint.style = PaintingStyle.fill;
    }
    canvas.restore();
  }

  static void _paintGrid(
    Canvas canvas,
    Rect board,
    double cell,
    Paint paint,
    Set<HeistPoint> walkable,
  ) {
    for (var y = 0; y < 6; y += 1) {
      for (var x = 0; x < 6; x += 1) {
        final point = HeistPoint(x, y);
        final rect = Rect.fromLTWH(
          board.left + x * cell + 2,
          board.top + y * cell + 2,
          cell - 4,
          cell - 4,
        );
        paint.color = walkable.contains(point)
            ? const Color(0xff173a56)
            : const Color(0xff091a2b);
        canvas.drawRRect(
          RRect.fromRectAndRadius(rect, const Radius.circular(5)),
          paint,
        );
        paint
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1
          ..color = const Color(0x334f85a4);
        canvas.drawRRect(
          RRect.fromRectAndRadius(rect.deflate(3), const Radius.circular(3)),
          paint,
        );
        paint.style = PaintingStyle.fill;
      }
    }
  }

  static void _paintCamera(
    Canvas canvas,
    HeistLevel level,
    Rect board,
    double cell,
    Paint paint,
  ) {
    final camera = level.camera;
    if (camera == null) return;
    final origin = HeistBoardSymbols.centerFor(board, cell, camera.position);
    final path = Path()
      ..moveTo(origin.dx, origin.dy)
      ..lineTo(origin.dx - cell * 3, origin.dy - cell * 1.6)
      ..lineTo(origin.dx - cell * 3, origin.dy + cell * 1.6)
      ..close();
    paint.color = const Color(0x254b9ec2);
    canvas.drawPath(path, paint);
    paint
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = const Color(0xff4b9ec2);
    canvas.drawCircle(origin, cell * 0.16, paint);
    paint.style = PaintingStyle.fill;
  }

  static void _paintGuardRoute(
    Canvas canvas,
    HeistLevel level,
    Rect board,
    double cell,
    Paint paint,
  ) {
    final path = Path();
    for (var index = 0; index < level.guardPath.length; index += 1) {
      final point = HeistBoardSymbols.centerFor(
        board,
        cell,
        level.guardPath[index],
      );
      if (index == 0) {
        path.moveTo(point.dx, point.dy);
      } else {
        path.lineTo(point.dx, point.dy);
      }
    }
    path.close();
    paint
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..color = const Color(0xfff26f5b);
    canvas.drawPath(path, paint);
    paint.style = PaintingStyle.fill;
    for (final point in level.guardPath) {
      paint.color = const Color(0xfff26f5b);
      canvas.drawCircle(
        HeistBoardSymbols.centerFor(board, cell, point),
        cell * 0.07,
        paint,
      );
    }
  }

  static void _paintLaser(
    Canvas canvas,
    HeistLevel level,
    Rect board,
    double cell,
    Paint paint,
  ) {
    for (final laser in level.lasers) {
      paint
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5
        ..strokeCap = StrokeCap.round
        ..color = const Color(0xfff26f5b);
      canvas.drawLine(
        HeistBoardSymbols.centerFor(board, cell, laser.from),
        HeistBoardSymbols.centerFor(board, cell, laser.to),
        paint,
      );
    }
    paint.style = PaintingStyle.fill;
  }

  static void _paintRoute(
    Canvas canvas,
    HeistLevel level,
    List<HeistAction> actions,
    Rect board,
    double cell,
    Paint paint,
  ) {
    if (actions.isEmpty) return;
    var position = level.start;
    final points = <HeistPoint>[position];
    for (final action in actions) {
      final next = position.move(action.type);
      if (!level.isWalkable(next, doorOpen: true)) break;
      position = next;
      points.add(position);
    }
    paint
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round
      ..color = const Color(0xff9be3d5);
    for (var index = 1; index < points.length; index += 1) {
      canvas.drawLine(
        HeistBoardSymbols.centerFor(board, cell, points[index - 1]),
        HeistBoardSymbols.centerFor(board, cell, points[index]),
        paint,
      );
    }
    paint.style = PaintingStyle.fill;
    for (var index = 1; index < points.length; index += 1) {
      paint.color = const Color(0xff9be3d5);
      canvas.drawCircle(
        HeistBoardSymbols.centerFor(board, cell, points[index]),
        cell * 0.08,
        paint,
      );
      HeistBoardSymbols.drawNumber(
        canvas,
        '$index',
        HeistBoardSymbols.centerFor(board, cell, points[index]),
        cell * 0.16,
      );
    }
  }
}
