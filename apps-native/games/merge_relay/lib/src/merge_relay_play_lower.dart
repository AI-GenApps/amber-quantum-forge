part of 'merge_relay_play_screen.dart';

/// The Play screen's lower area (task 11): a full-bleed card in the board
/// tray's own colour (so it reads as a control tray continuing the board
/// downward, not as background) holding either the accessible move
/// controls or the swipe hint, plus the save-error message when present.
/// Filling this `Expanded` region with a real card — rather than leaving it
/// as bare background behind one line of hint text — is what keeps the
/// space below the board from reading as a flat empty band.
final class _PlayLowerArea extends StatelessWidget {
  const _PlayLowerArea({
    required this.game,
    required this.theme,
    required this.compact,
  });

  final MergeRelayGame game;
  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final budget = game.movesRemaining;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: theme.board,
        borderRadius: BorderRadius.circular(MrTokens.radiusLarge),
        border: Border.all(color: theme.ink.withValues(alpha: 0.08)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: 16,
            vertical: compact ? 10 : 16,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: (constraints.maxHeight - (compact ? 20 : 32)).clamp(
                0,
                double.infinity,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (game.preferences.value.accessibleControls)
                  MergeMoveControls(
                    game: game,
                    enabled:
                        game.hydrated.value &&
                        !game.roundComplete.value &&
                        !game.isPaused.value,
                    theme: theme,
                  )
                else
                  _SwipeHint(theme: theme, compact: compact),
                if (budget != null) ...[
                  SizedBox(height: compact ? 8 : 14),
                  _MovesLeftNote(theme: theme, budget: budget),
                ],
                if (game.persistenceMessage.value != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    game.persistenceMessage.value!,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: theme.coral, fontSize: 11),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

final class _SwipeHint extends StatelessWidget {
  const _SwipeHint({required this.theme, required this.compact});

  final MergeRelayTheme theme;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.swipe_rounded, color: theme.muted, size: compact ? 22 : 28),
        SizedBox(height: compact ? 4 : 8),
        Text(
          'Swipe the board to move',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: theme.muted,
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

final class _MovesLeftNote extends StatelessWidget {
  const _MovesLeftNote({required this.theme, required this.budget});

  final MergeRelayTheme theme;
  final int budget;

  @override
  Widget build(BuildContext context) {
    return Text(
      budget == 0 ? 'Last move — make it count.' : '$budget moves to go',
      textAlign: TextAlign.center,
      style: TextStyle(
        color: budget == 0 ? theme.coral : theme.ink.withValues(alpha: 0.7),
        fontSize: 12,
        fontFamily: 'Fredoka',
        fontWeight: FontWeight.w800,
      ),
    );
  }
}
