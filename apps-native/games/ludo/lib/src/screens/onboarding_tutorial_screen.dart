/// Final onboarding step: an interactive mini-tutorial that walks the
/// player through rolling, moving, and capturing on a real (reduced-scale)
/// board.
///
/// This screen drives the actual `ludo_rules` engine (`rollDice`/
/// `applyMove`) and renders through the actual `LudoGame`/
/// `LudoBoardComponent`/`LudoTokenComponent`/`LudoDiceComponent` from
/// tasks 01/04/05 — a one-token-per-player [LudoRuleset] keeps the board
/// visually "mini" without needing a second, fake board implementation.
/// Every dice roll in the script is scripted ([ScriptedDiceSource]), not
/// random, so the tutorial always plays out the same fixed lesson.
library;

import 'package:flame/game.dart';
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart';

import 'home_lobby_screen.dart' show HomeLobbyScreen;
import '../game/ludo_game.dart';
import '../state/ludo_profile_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_onboarding_controls.dart';
import '../widgets/ludo_panel.dart';

/// One token per player, otherwise identical numeric rules to Classic — a
/// genuinely mini board (task 07: "a mini board, 1-2 tokens"), not a fake
/// one: every other rule (track length, safe cells, capture) is unchanged.
const ludoTutorialRuleset = LudoRuleset(
  id: 'tutorial',
  tokensPerPlayer: 1,
  stepsToHomeEntry: 51,
  homeLength: 6,
  requiresYardExitRoll: true,
);

/// Absolute track cell the opponent's token is pre-placed on, chosen so the
/// scripted roll-then-move sequence below lands the player's token on it
/// (an uncontested, non-safe cell) and triggers a real capture.
const _opponentCaptureCell = 3;
const _opponentStartPathPosition =
    _opponentCaptureCell - 13 + 52; // green start index 13

/// One step of the fixed tutorial script.
enum _TutorialStep {
  rollToExit,
  moveToExit,
  rollToCapture,
  moveToCapture,
  done,
}

class OnboardingTutorialScreen extends StatefulWidget {
  const OnboardingTutorialScreen({
    super.key,
    required this.settings,
    required this.profileStore,
    this.reducedMotion,
    this.telemetry,
    this.diceSeed,
  });

  final LudoProfileSettings settings;
  final LudoProfileStore profileStore;

  /// Test seam: the telemetry sink `ludo_onboarding_completed`/
  /// `ludo_onboarding_skipped` record through. `null` (the default)
  /// resolves a fresh production [LudoTelemetry].
  final LudoTelemetry? telemetry;

  /// Test seam: forwarded all the way to `HomeLobbyScreen`'s started
  /// match. `null` (the default) in production.
  final int? diceSeed;

  /// Test seam: the [ReducedMotionSetting] this screen's [LudoGame] reads.
  /// Defaults to a fresh (motion-enabled) setting in production. Widget
  /// tests pass one with `enabled: true` so the dice tumble and token hop
  /// animations this screen drives resolve on the very next frame instead
  /// of needing several real-duration animation frames pumped — this
  /// screen hosts a live `GameWidget`/`FlameGame`, whose render loop never
  /// lets `pumpAndSettle` observe "no more frames pending", so tests must
  /// pump a bounded number of frames instead; reduced motion keeps that
  /// bound small and fast under test-suite concurrency.
  final ReducedMotionSetting? reducedMotion;

  @override
  State<OnboardingTutorialScreen> createState() =>
      _OnboardingTutorialScreenState();
}

class _OnboardingTutorialScreenState extends State<OnboardingTutorialScreen> {
  late final LudoGame _game;
  late LudoMatchState _state;
  _TutorialStep _step = _TutorialStep.rollToExit;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _state = _initialTutorialState();
    _game = LudoGame(initialState: _state, reducedMotion: widget.reducedMotion);
  }

  LudoMatchState _initialTutorialState() {
    final base = LudoMatchState.initial(
      ruleset: ludoTutorialRuleset,
      subjects: const ['you', 'tutor-bot'],
    );
    final opponent = base.players[1].copyWith(
      tokens: [LudoToken(id: 0, pathPosition: _opponentStartPathPosition)],
    );
    return base.copyWith(players: [base.players[0], opponent]);
  }

  String get _instruction => switch (_step) {
    _TutorialStep.rollToExit =>
      'Tap Roll to try to leave your yard — you need a 6 to get out.',
    _TutorialStep.moveToExit => 'You rolled a 6! Tap Move to enter the board.',
    _TutorialStep.rollToCapture =>
      'A 6 earns a bonus roll. Roll again to try to reach the opponent.',
    _TutorialStep.moveToCapture =>
      'Tap Move to land on the opponent and send their token home!',
    _TutorialStep.done =>
      'Great job! You captured an opponent token. Tap Finish to start playing.',
  };

  String get _actionLabel => switch (_step) {
    _TutorialStep.rollToExit || _TutorialStep.rollToCapture => 'Roll Dice',
    _TutorialStep.moveToExit || _TutorialStep.moveToCapture => 'Move Token',
    _TutorialStep.done => 'Finish',
  };

  Future<void> _handleAction() async {
    if (_busy) return;
    switch (_step) {
      case _TutorialStep.rollToExit:
        await _roll(6, _TutorialStep.moveToExit);
      case _TutorialStep.rollToCapture:
        await _roll(3, _TutorialStep.moveToCapture);
      case _TutorialStep.moveToExit:
      case _TutorialStep.moveToCapture:
        await _move();
      case _TutorialStep.done:
        await _finish(skipped: false);
    }
  }

  Future<void> _roll(int scriptedRoll, _TutorialStep nextStep) async {
    setState(() => _busy = true);
    final result = rollDice(_state, ScriptedDiceSource([scriptedRoll]));
    await _game.applyEvents(result.events, result.state);
    if (!mounted) return;
    setState(() {
      _state = result.state;
      _step = nextStep;
      _busy = false;
    });
  }

  Future<void> _move() async {
    setState(() => _busy = true);
    final result = applyMove(_state, 0);
    await _game.applyEvents(result.events, result.state);
    if (!mounted) return;
    setState(() {
      _state = result.state;
      _step = _step == _TutorialStep.moveToExit
          ? _TutorialStep.rollToCapture
          : _TutorialStep.done;
      _busy = false;
    });
  }

  Future<void> _finish({required bool skipped}) async {
    widget.settings.onboardingComplete = true;
    await widget.profileStore.save(widget.settings);
    final telemetry = widget.telemetry ?? LudoTelemetry();
    if (skipped) {
      telemetry.onboardingSkipped();
    } else {
      telemetry.onboardingCompleted();
    }
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(
        builder: (_) => HomeLobbyScreen(
          telemetry: widget.telemetry,
          diceSeed: widget.diceSeed,
        ),
      ),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('How to play'),
        actions: [LudoSkipButton(onPressed: () => _finish(skipped: true))],
      ),
      body: LudoBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Expanded(
                  child: Center(
                    child: AspectRatio(
                      aspectRatio: 1,
                      child: LudoPanel(
                        padding: const EdgeInsets.all(LudoThemeTokens.spaceSm),
                        child: Semantics(
                          label: 'Tutorial board',
                          child: GameWidget(game: _game),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  _instruction,
                  textAlign: TextAlign.center,
                  style: LudoTextStyles.body,
                ),
                const SizedBox(height: 16),
                LudoPrimaryButton(
                  label: _actionLabel,
                  semanticsLabel: switch (_step) {
                    _TutorialStep.rollToExit ||
                    _TutorialStep.rollToCapture => 'Roll dice',
                    _TutorialStep.moveToExit ||
                    _TutorialStep.moveToCapture => 'Move token',
                    _TutorialStep.done => 'Finish tutorial',
                  },
                  onPressed: _busy ? null : _handleAction,
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
