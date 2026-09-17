import 'package:flutter/material.dart';
import 'package:snapquest_rules/snapquest_rules.dart';

import 'capabilities/camera_capture_models.dart';
import 'snapquest_theme.dart';

class PeeklingArt extends StatelessWidget {
  const PeeklingArt({required this.creatureId, this.size = 64, super.key});

  final String creatureId;
  final double size;

  @override
  Widget build(BuildContext context) {
    final name = switch (creatureId) {
      'emberling' => 'Emberling',
      'azurling' => 'Azurling',
      _ => 'Peekling',
    };
    return Semantics(
      label: '$name creature',
      image: true,
      child: CustomPaint(
        size: Size.square(size),
        painter: _PeeklingPainter(creatureId),
      ),
    );
  }
}

class _PeeklingPainter extends CustomPainter {
  const _PeeklingPainter(this.creatureId);

  final String creatureId;

  @override
  void paint(Canvas canvas, Size size) {
    final shortestSide = size.width < size.height ? size.width : size.height;
    final unit = shortestSide / 100;
    canvas.scale(unit, unit);
    final bodyColor = creatureId == 'azurling'
        ? SnapDesign.sky
        : SnapDesign.coral;
    final body = Paint()..color = bodyColor;
    final ink = Paint()..color = SnapDesign.night;
    final white = Paint()..color = Colors.white;

    if (creatureId == 'azurling') {
      final fin = Path()
        ..moveTo(18, 55)
        ..lineTo(3, 42)
        ..lineTo(12, 68)
        ..close();
      final otherFin = Path()
        ..moveTo(82, 55)
        ..lineTo(97, 42)
        ..lineTo(88, 68)
        ..close();
      canvas.drawPath(fin, body);
      canvas.drawPath(otherFin, body);
    } else {
      final flame = Path()
        ..moveTo(50, 28)
        ..cubicTo(36, 18, 48, 8, 57, 3)
        ..cubicTo(57, 15, 72, 17, 65, 31)
        ..close();
      canvas.drawPath(flame, body);
    }

    final silhouette = Path()
      ..moveTo(19, 58)
      ..quadraticBezierTo(20, 36, 50, 32)
      ..quadraticBezierTo(80, 36, 81, 58)
      ..quadraticBezierTo(84, 88, 50, 94)
      ..quadraticBezierTo(16, 88, 19, 58)
      ..close();
    canvas.drawPath(silhouette, body);

    if (creatureId == 'azurling') {
      final shell = Paint()
        ..color = SnapDesign.lavender
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3;
      canvas.drawArc(
        const Rect.fromLTWH(28, 16, 44, 44),
        3.55,
        2.3,
        false,
        shell,
      );
      canvas.drawLine(const Offset(50, 19), const Offset(50, 52), shell);
    } else {
      canvas.drawCircle(const Offset(50, 66), 14, ink);
      canvas.drawCircle(const Offset(50, 62), 6, body);
    }

    for (final eyeX in const [38.0, 62.0]) {
      canvas.drawCircle(Offset(eyeX, 55), 8, white);
      canvas.drawCircle(Offset(eyeX, 55), 4, ink);
    }
    final smile = Path()
      ..moveTo(42, 72)
      ..quadraticBezierTo(50, 79, 58, 72);
    canvas.drawPath(
      smile,
      Paint()
        ..color = ink.color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_PeeklingPainter oldDelegate) =>
      oldDelegate.creatureId != creatureId;
}

class SnapCameraPanel extends StatelessWidget {
  const SnapCameraPanel({
    required this.message,
    required this.metadata,
    required this.busy,
    required this.onTry,
    super.key,
  });

  final String message;
  final CameraCaptureMetadata? metadata;
  final bool busy;
  final VoidCallback onTry;

  @override
  Widget build(BuildContext context) {
    final frameReceived = metadata?.frameCaptured == true;
    return SnapPanel(
      color: SnapDesign.sky,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Camera scan', style: _snapTitle(context)),
              const Spacer(),
              Icon(
                frameReceived
                    ? Icons.check_circle_rounded
                    : Icons.camera_alt_rounded,
                color: SnapDesign.night,
              ),
            ],
          ),
          const SizedBox(height: 5),
          if (frameReceived)
            Text(
              'Snapshot caught. Finish at the desk.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          if (frameReceived) const SizedBox(height: 10),
          if (!frameReceived)
            Text(message, style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 13),
          OutlinedButton.icon(
            onPressed: busy ? null : onTry,
            icon: const Icon(Icons.camera_alt_rounded),
            label: Text(busy ? 'Checking camera…' : 'Try the camera'),
          ),
        ],
      ),
    );
  }
}

class SnapAlbumPanel extends StatelessWidget {
  const SnapAlbumPanel({
    required this.entries,
    required this.creatureName,
    super.key,
  });

  final List<AlbumEntry> entries;
  final String Function(String) creatureName;

  @override
  Widget build(BuildContext context) {
    return SnapPanel(
      color: SnapDesign.lavender,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your little collection', style: _snapTitle(context)),
          const SizedBox(height: 11),
          for (final entry in entries)
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: PeeklingArt(creatureId: entry.creatureId, size: 56),
              title: Text(creatureName(entry.creatureId)),
              subtitle: Text('From ${entry.descriptorId}'),
              trailing: const Icon(Icons.auto_awesome_rounded),
            ),
        ],
      ),
    );
  }
}

class SnapPanel extends StatelessWidget {
  const SnapPanel({required this.color, required this.child, super.key});

  final Color color;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: SnapDesign.night, width: 1.7),
      ),
      child: child,
    );
  }
}

TextStyle _snapTitle(BuildContext context) =>
    Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 19);
