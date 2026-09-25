import 'package:flutter/material.dart';
import 'package:biome_rules/biome_rules.dart';

import 'biome_content.dart';
import 'pocket_biome_typography.dart';

const _biomeInk = Color(0xff29483b);

final class BiomeAlbumPanel extends StatelessWidget {
  const BiomeAlbumPanel({required this.state, super.key});

  final BiomeState state;

  @override
  Widget build(BuildContext context) {
    final entries = state.album
        .map((id) => speciesName(pocketBiomeSpecies, id))
        .toList(growable: false);
    return Container(
      padding: const EdgeInsets.fromLTRB(15, 13, 15, 14),
      decoration: BoxDecoration(
        color: const Color(0xffe7ead7),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0x33668072)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ALBUM',
            style: PocketBiomeTypography.body(
              const TextStyle(
                color: _biomeInk,
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
              ),
            ),
          ),
          const SizedBox(height: 8),
          if (entries.isEmpty)
            Text(
              'Harvest a grown plant to start your collection.',
              style: PocketBiomeTypography.body(
                const TextStyle(color: Color(0xff61705d)),
              ),
            )
          else
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: entries
                  .map(
                    (entry) => Chip(
                      label: Text(entry),
                      avatar: const Icon(Icons.local_florist, size: 16),
                      backgroundColor: const Color(0xfff5e1b3),
                    ),
                  )
                  .toList(growable: false),
            ),
        ],
      ),
    );
  }
}
