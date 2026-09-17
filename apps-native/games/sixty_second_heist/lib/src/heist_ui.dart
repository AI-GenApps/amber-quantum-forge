import 'package:flutter/material.dart';
import 'package:heist_rules/heist_rules.dart';
import 'package:platform_core/platform_core.dart';

import 'heist_app.dart';
import 'heist_ui_components.dart';
import 'heist_ui_controls.dart';

const _heistInk = Color(0xff0d2238);
const _heistPaper = Color(0xffedf4f8);
const _heistBlue = Color(0xff2b6f9d);
const _heistCoral = Color(0xff9a3732);
const _heistMint = Color(0xff318f85);

final class SixtySecondHeistApp extends StatefulWidget {
  const SixtySecondHeistApp({this.saveStore, super.key});

  final SaveStore? saveStore;

  @override
  State<SixtySecondHeistApp> createState() => _SixtySecondHeistAppState();
}

final class _SixtySecondHeistAppState extends State<SixtySecondHeistApp> {
  late final HeistGame game;

  @override
  void initState() {
    super.initState();
    game = HeistGame(
      context: runtimeAppContext(identity: sixtySecondHeistIdentity),
      saveStore: widget.saveStore ?? MemorySaveStore(),
    );
    game.restore();
  }

  @override
  void dispose() {
    game.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: sixtySecondHeistIdentity.publicTitle,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: _heistBlue),
        scaffoldBackgroundColor: _heistPaper,
        useMaterial3: true,
      ),
      home: HeistScreen(game: game),
    );
  }
}

final class HeistScreen extends StatelessWidget {
  const HeistScreen({required this.game, super.key});

  final HeistGame game;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _heistPaper,
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
                    constraints: const BoxConstraints(maxWidth: 640),
                    child: ListenableBuilder(
                      listenable: Listenable.merge([
                        game.actions,
                        game.outcome,
                        game.hydrated,
                        game.persistenceMessage,
                      ]),
                      builder: (context, _) {
                        final actions = game.actions.value;
                        final outcome = game.outcome.value;
                        final ready = game.hydrated.value;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _HeistHeader(
                              actionCount: actions.length,
                              status: _statusLabel(outcome, ready),
                            ),
                            const SizedBox(height: 15),
                            _HeistStats(actions: actions, outcome: outcome),
                            const SizedBox(height: 14),
                            HeistBlueprint(game: game, enabled: ready),
                            const SizedBox(height: 12),
                            HeistRouteStrip(actions: actions),
                            const SizedBox(height: 12),
                            if (game.persistenceMessage.value
                                case final String message)
                              HeistNotice(message: message),
                            HeistControls(game: game, enabled: ready),
                            const SizedBox(height: 12),
                            HeistHint(outcome: outcome, ready: ready),
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

  String _statusLabel(HeistOutcome? outcome, bool ready) {
    if (!ready) return 'Opening';
    if (outcome == null) return 'Plan ready';
    return outcome.succeeded
        ? 'Escaped'
        : switch (outcome.status) {
            HeistOutcomeStatus.failure => 'Spotted',
            HeistOutcomeStatus.invalid => 'Blocked',
            HeistOutcomeStatus.timeout => 'Out of time',
            HeistOutcomeStatus.success => 'Escaped',
          };
  }
}

final class _HeistHeader extends StatelessWidget {
  const _HeistHeader({required this.actionCount, required this.status});

  final int actionCount;
  final String status;

  @override
  Widget build(BuildContext context) {
    final active = status == 'Escaped';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          spacing: 8,
          runSpacing: 6,
          children: [
            const Text(
              'MISSION 1',
              style: TextStyle(
                color: _heistCoral,
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 1.5,
              ),
            ),
            DecoratedBox(
              decoration: BoxDecoration(
                color: active ? _heistMint : _heistInk,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                child: Text(
                  status,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Text(
          'Sixty-Second Heist',
          style: TextStyle(
            color: _heistInk,
            fontSize: 34,
            fontWeight: FontWeight.w900,
            height: 1,
            letterSpacing: -1.1,
          ),
        ),
        const SizedBox(height: 7),
        Text(
          '$actionCount / 64 steps',
          style: const TextStyle(color: Color(0xff5f7284), fontSize: 16),
        ),
      ],
    );
  }
}

final class _HeistStats extends StatelessWidget {
  const _HeistStats({required this.actions, required this.outcome});

  final List<HeistAction> actions;
  final HeistOutcome? outcome;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _Stat(label: 'ROUTE', value: '${actions.length}', color: _heistBlue),
        const SizedBox(width: 10),
        _Stat(
          label: 'PATH',
          value: '${outcome?.trace.length ?? 0}',
          color: _heistMint,
        ),
        const SizedBox(width: 10),
        _Stat(
          label: 'LOOT',
          value: outcome?.lootCollected == true ? 'YES' : 'NO',
          color: _heistCoral,
        ),
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
          color: Colors.white.withValues(alpha: 0.72),
          border: Border.all(color: color.withValues(alpha: 0.22)),
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
                color: _heistInk,
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
