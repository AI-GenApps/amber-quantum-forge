import 'package:flutter/material.dart';

import 'snapquest_theme.dart';
import 'snapquest_secondary_cards.dart';

export 'snapquest_secondary_cards.dart';

class SnapTargetCard extends StatelessWidget {
  const SnapTargetCard({
    required this.colorName,
    required this.targetColor,
    required this.symbol,
    required this.creatureName,
    required this.creatureId,
    super.key,
  });

  final String colorName;
  final Color targetColor;
  final String symbol;
  final String creatureName;
  final String creatureId;

  @override
  Widget build(BuildContext context) {
    return SnapPanel(
      color: SnapDesign.night,
      child: Row(
        children: [
          PeeklingArt(creatureId: creatureId, size: 70),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Today’s target',
                  style: TextStyle(
                    color: SnapDesign.sky,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      symbol,
                      style: TextStyle(
                        color: targetColor,
                        fontSize: 25,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      colorName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 25,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
                Text(
                  'Meet $creatureName',
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ],
            ),
          ),
          Icon(Icons.flag_rounded, color: targetColor, size: 28),
        ],
      ),
    );
  }
}

class SnapDeskPanel extends StatelessWidget {
  const SnapDeskPanel({
    required this.objects,
    required this.onSelect,
    required this.targetDescriptor,
    required this.enabled,
    super.key,
  });

  final List<SnapDeskObject> objects;
  final ValueChanged<SnapDeskObject> onSelect;
  final String targetDescriptor;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return SnapPanel(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Desk hunt', style: _snapTitle(context)),
              const Spacer(),
              const Icon(Icons.touch_app_rounded, color: SnapDesign.coral),
            ],
          ),
          const SizedBox(height: 5),
          Text(
            'Tap the matching object.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: objects.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.9,
            ),
            itemBuilder: (context, index) {
              final object = objects[index];
              return SnapObjectTile(
                object: object,
                highlighted: object.descriptorId == targetDescriptor,
                onTap: enabled ? () => onSelect(object) : null,
              );
            },
          ),
        ],
      ),
    );
  }
}

class SnapDeskObject {
  const SnapDeskObject({
    required this.name,
    required this.descriptorId,
    required this.symbol,
    required this.color,
  });

  final String name;
  final String descriptorId;
  final String symbol;
  final Color color;
}

class SnapObjectTile extends StatelessWidget {
  const SnapObjectTile({
    required this.object,
    required this.highlighted,
    required this.onTap,
    super.key,
  });

  final SnapDeskObject object;
  final bool highlighted;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: object.color,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: highlighted ? SnapDesign.night : Colors.transparent,
              width: 2.5,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                object.symbol,
                style: const TextStyle(
                  color: SnapDesign.night,
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                object.name,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: SnapDesign.night,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

TextStyle _snapTitle(BuildContext context) =>
    Theme.of(context).textTheme.titleLarge!.copyWith(fontSize: 19);
