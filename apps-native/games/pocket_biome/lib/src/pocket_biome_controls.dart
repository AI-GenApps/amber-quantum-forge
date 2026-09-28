import 'package:flutter/material.dart';

import 'pocket_biome_app.dart';
import 'pocket_biome_typography.dart';

const _biomeControlsInk = Color(0xff29483b);
const _biomeControlsApricot = Color(0xffa94d2f);

// Quicksand runs a little wider than the Material default at the same
// size, and these two-word labels ("Plant Mossling", "Nothing ready") sit
// in a half-width button next to a leading icon — tuned down just enough
// (tighter letter-spacing, smaller icon and padding) to keep both on one
// line at every tested width, with no copy change.
final _biomeButtonLabelStyle = PocketBiomeTypography.body(
  const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: 0),
);
const _biomeButtonIconSize = 18.0;
const _biomeButtonPadding = EdgeInsets.symmetric(horizontal: 10);

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
              icon: const Icon(Icons.spa, size: _biomeButtonIconSize),
              label: Text('Plant Mossling', style: _biomeButtonLabelStyle),
              style: FilledButton.styleFrom(
                backgroundColor: _biomeControlsInk,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(50),
                padding: _biomeButtonPadding,
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
              icon: const Icon(Icons.auto_awesome, size: _biomeButtonIconSize),
              label: Text(
                harvestable == -1 ? 'Nothing ready' : 'Harvest',
                style: _biomeButtonLabelStyle,
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: _biomeControlsApricot,
                minimumSize: const Size.fromHeight(50),
                side: const BorderSide(color: _biomeControlsApricot),
                padding: _biomeButtonPadding,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
