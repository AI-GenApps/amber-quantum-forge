import 'package:flutter/material.dart';

import 'pocket_biome_app.dart';

const _biomeControlsInk = Color(0xff29483b);
const _biomeControlsApricot = Color(0xffa94d2f);

final class BiomeActions extends StatelessWidget {
  const BiomeActions({
    required this.game,
    required this.enabled,
    required this.harvestable,
    super.key,
  });

  final PocketBiomeGame game;
  final bool enabled;
  final int harvestable;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Semantics(
            button: true,
            label: 'Plant a Mossling',
            child: FilledButton.icon(
              onPressed: enabled ? game.plantMossling : null,
              icon: const Icon(Icons.spa),
              label: const Text('Plant Mossling'),
              style: FilledButton.styleFrom(
                backgroundColor: _biomeControlsInk,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(50),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Semantics(
            button: true,
            label: harvestable == -1
                ? 'No ready specimen'
                : 'Harvest slot ${harvestable + 1}',
            child: OutlinedButton.icon(
              onPressed: harvestable == -1
                  ? null
                  : () => game.harvest(harvestable),
              icon: const Icon(Icons.auto_awesome),
              label: Text(harvestable == -1 ? 'Nothing ready' : 'Harvest'),
              style: OutlinedButton.styleFrom(
                foregroundColor: _biomeControlsApricot,
                minimumSize: const Size.fromHeight(50),
                side: const BorderSide(color: _biomeControlsApricot),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
