/// Drives sequential bot turns after a human action resolves (task 12).
///
/// Pure logic over `ludo_rules`' engine and task 02's bot strategies — no
/// Flutter/Flame import here at all, so this same runner is reusable by
/// both `game_board_screen.dart` (vs-Computer local play) and task 26's
/// online board wiring for a bot-filled seat, without duplicating bot-turn
/// logic between the two call sites (see this task's Context/Decisions).
library;

import 'package:ludo_rules/ludo_rules.dart';
import 'package:platform_core/platform_core.dart' show DeterministicRng;

/// One resolved step of automated bot play (a roll, or a move), paired
/// with the acting seat, the resulting state, and the `ludo_rules` events
/// it produced — so a caller can drive its `LudoGame.applyEvents` once per
/// step, exactly like the human path in `game_board_screen.dart` already
/// does, instead of jumping straight to the end of the bot's turn.
sealed class LudoBotTurnStep {
  const LudoBotTurnStep({
    required this.seat,
    required this.state,
    required this.events,
  });

  /// The seat (0-based) whose action produced this step.
  final int seat;
  final LudoMatchState state;
  final List<LudoReplayEvent> events;
}

/// A bot seat's dice roll (which may itself end the bot's turn, if the
/// roll had no legal move and `rollDice` auto-passed it).
final class LudoBotRollStep extends LudoBotTurnStep {
  const LudoBotRollStep({
    required super.seat,
    required super.state,
    required super.events,
    required this.roll,
  });

  final int roll;
}

/// A bot seat's chosen move.
final class LudoBotMoveStep extends LudoBotTurnStep {
  const LudoBotMoveStep({
    required super.seat,
    required super.state,
    required super.events,
    required this.tokenId,
  });

  final int tokenId;
}

/// A seat's bot-ness and difficulty, decoupled from
/// `mode_setup_sheet.dart`'s `LudoSeatConfig` so this file has no
/// dependency on any screen — callers adapt their own seat config shape
/// into this list.
final class LudoBotSeat {
  const LudoBotSeat({required this.isBot, this.difficulty});

  final bool isBot;

  /// One of `easy`/`medium`/`hard` (see `ludoBotStrategyById`); ignored
  /// when [isBot] is `false`. Defaults to `medium` when a bot seat leaves
  /// this unset.
  final String? difficulty;
}

/// Drives every consecutive bot seat's turn(s) from a starting state,
/// stopping the moment the active seat is no longer a bot seat or the
/// match finishes — including any bonus roll a bot earns on a six or a
/// capture/home-arrival. Never plays a human seat's turn.
class LudoBotTurnRunner {
  const LudoBotTurnRunner({
    required this.seats,
    this.delayBetweenSteps = const Duration(milliseconds: 700),
  });

  /// One entry per seat, in seat order — must be the same length as
  /// `state.players` for any state this runner is asked to drive.
  final List<LudoBotSeat> seats;

  /// How long to pause after applying each step's events before driving
  /// the next roll/move, so the board's hop/tumble animation (tasks 04/05)
  /// is perceptible instead of instant-jumping through an entire bot
  /// sequence. Tests pass [Duration.zero] to skip the wait entirely.
  final Duration delayBetweenSteps;

  bool isBotSeat(int seatIndex) => seats[seatIndex].isBot;

  /// Runs every consecutive bot turn starting from [state], invoking
  /// [onStep] once per roll/move (in order) with that step. Returns the
  /// state once the active seat is no longer a bot seat, or the match has
  /// finished. [rng] drives both dice rolls and any bot-strategy
  /// tie-break, exactly as the human roll path in `game_board_screen.dart`
  /// drives `rollDice` from its own `DeterministicRng`.
  ///
  /// [state] may itself already be mid-turn (`LudoMatchPhase.awaitingMove`)
  /// for the active bot seat — resuming a saved local match (task 11) can
  /// land here if the app was killed right after a bot's roll but before
  /// its move — in which case this only plays that pending move rather
  /// than rolling again.
  Future<LudoMatchState> run(
    LudoMatchState state,
    DeterministicRng rng, {
    required Future<void> Function(LudoBotTurnStep step) onStep,
  }) async {
    var current = state;
    while (current.phase != LudoMatchPhase.finished &&
        isBotSeat(current.currentPlayerIndex)) {
      final actingSeat = current.currentPlayerIndex;

      if (current.phase == LudoMatchPhase.awaitingRoll) {
        final rollResult = rollDice(
          current,
          FunctionDiceSource(() => rng.nextInt(6) + 1),
        );
        current = rollResult.state;
        await onStep(
          LudoBotRollStep(
            seat: actingSeat,
            state: current,
            events: rollResult.events,
            roll: rollResult.roll,
          ),
        );
        await _delay();
      }

      if (current.phase != LudoMatchPhase.awaitingMove) {
        // Either the roll had no legal move (`rollDice` already
        // auto-passed the turn) or the match just finished; loop around
        // and re-check the new state.
        continue;
      }

      final strategy = ludoBotStrategyById(
        seats[actingSeat].difficulty ?? 'medium',
      );
      final tokenId = strategy.selectMove(current, rng);
      final moveResult = applyMove(current, tokenId);
      current = moveResult.state;
      await onStep(
        LudoBotMoveStep(
          seat: actingSeat,
          state: current,
          events: moveResult.events,
          tokenId: tokenId,
        ),
      );
      await _delay();
    }
    return current;
  }

  Future<void> _delay() {
    if (delayBetweenSteps <= Duration.zero) return Future<void>.value();
    return Future<void>.delayed(delayBetweenSteps);
  }
}
