import 'package:flutter/material.dart';
import 'package:biome_rules/biome_rules.dart';

import 'biome_content.dart';
import 'pocket_biome_app.dart';
import 'pocket_biome_album.dart';
import 'pocket_biome_painter.dart';
import 'pocket_biome_controls.dart';

const _biomeInk = Color(0xff29483b);
const _biomePaper = Color(0xfff4f0df);
const _biomeSage = Color(0xffd6e3d2);
const _biomeApricot = Color(0xffa94d2f);

final class PocketBiomeScreen extends StatelessWidget {
  const PocketBiomeScreen({required this.game, super.key});

  final PocketBiomeGame game;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _biomePaper,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: constraints.maxHeight - 42,
                ),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 620),
                    child: ListenableBuilder(
                      listenable: Listenable.merge([
                        game.state,
                        game.hydrated,
                        game.persistenceMessage,
                        game.feedback,
                        game.selectedSlot,
                      ]),
                      builder: (context, _) {
                        final state = game.state.value;
                        final ready = game.hydrated.value;
                        final harvestable = ready
                            ? state.slots.indexWhere(
                                (slot) =>
                                    slot?.isReadyAt(game.clock.now()) ?? false,
                              )
                            : -1;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const _BiomeHeader(),
                            const SizedBox(height: 16),
                            _BiomeStats(state: state),
                            const SizedBox(height: 14),
                            _Terrarium(game: game, enabled: ready),
                            const SizedBox(height: 12),
                            _BiomeFeedback(game: game),
                            const SizedBox(height: 10),
                            BiomeActions(
                              game: game,
                              enabled: ready,
                              harvestable: harvestable,
                            ),
                            const SizedBox(height: 14),
                            BiomeAlbumPanel(state: state),
                          ],
                        );
                      },
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

final class _BiomeHeader extends StatelessWidget {
  const _BiomeHeader();

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'TINY HABITAT',
          style: TextStyle(
            color: _biomeApricot,
            fontSize: 12,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
        ),
        SizedBox(height: 8),
        Text(
          'Pocket Biome',
          style: TextStyle(
            color: _biomeInk,
            fontSize: 36,
            fontWeight: FontWeight.w900,
            height: 1,
            letterSpacing: -1.2,
          ),
        ),
        SizedBox(height: 7),
        Text(
          'Grow a tiny world, one careful harvest at a time.',
          style: TextStyle(color: Color(0xff61705d), fontSize: 16),
        ),
      ],
    );
  }
}

final class _BiomeStats extends StatelessWidget {
  const _BiomeStats({required this.state});

  final BiomeState state;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _Stat(label: 'ALBUM', value: '${state.album.length}', color: _biomeInk),
        const SizedBox(width: 10),
        _Stat(
          label: 'COMPOST',
          value: '${state.compost}',
          color: _biomeApricot,
        ),
        const SizedBox(width: 10),
        const _Stat(label: 'POTS', value: '6', color: Color(0xff668d72)),
      ],
    );
  }
}

final class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, required this.color});

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.fromLTRB(13, 10, 13, 11),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.58),
          border: Border.all(color: color.withValues(alpha: 0.2)),
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.1,
              ),
            ),
            const SizedBox(height: 3),
            Text(
              value,
              style: const TextStyle(
                color: _biomeInk,
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

final class _Terrarium extends StatelessWidget {
  const _Terrarium({required this.game, required this.enabled});

  final PocketBiomeGame game;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: _biomeSage,
        borderRadius: BorderRadius.circular(30),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1f29483b),
            blurRadius: 18,
            offset: Offset(0, 9),
          ),
        ],
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth;
          final height = width / 1.28;
          return SizedBox(
            width: width,
            height: height,
            child: Stack(
              children: [
                Positioned.fill(
                  child: IgnorePointer(
                    child: CustomPaint(painter: PocketBiomePainter(game: game)),
                  ),
                ),
                for (var index = 0; index < 6; index += 1)
                  Positioned(
                    left: (index % 3) * width / 3,
                    top: (index ~/ 3) * height / 2,
                    width: width / 3,
                    height: height / 2,
                    child: Semantics(
                      button: true,
                      enabled: enabled,
                      label: _slotLabel(index),
                      onTap: enabled ? () => game.inspectSlot(index) : null,
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        excludeFromSemantics: true,
                        onTap: enabled ? () => game.inspectSlot(index) : null,
                        child: const SizedBox.expand(),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  String _slotLabel(int index) {
    final slot = game.state.value.slots[index];
    if (slot == null) return 'Pot ${index + 1}, empty';
    final name = speciesName(game.rules.speciesById.values, slot.speciesId);
    final status = slot.isReadyAt(game.clock.now())
        ? 'ready to harvest'
        : 'growing';
    return 'Pot ${index + 1}, $name, $status';
  }
}

final class _BiomeFeedback extends StatelessWidget {
  const _BiomeFeedback({required this.game});

  final PocketBiomeGame game;

  @override
  Widget build(BuildContext context) {
    final message =
        game.persistenceMessage.value ??
        game.feedback.value ??
        (game.hydrated.value
            ? 'Tap a pot to inspect its growth.'
            : 'Waking the terrarium…');
    return Row(
      children: [
        const Icon(Icons.eco, color: _biomeApricot, size: 18),
        const SizedBox(width: 7),
        Expanded(
          child: Text(
            message,
            style: const TextStyle(
              color: _biomeInk,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        TextButton(
          onPressed: game.hydrated.value ? game.inspectHabitat : null,
          child: const Text('Inspect'),
        ),
      ],
    );
  }
}
