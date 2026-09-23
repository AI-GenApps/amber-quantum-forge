part of 'merge_relay_relay_screen.dart';

extension on _MergeRelayRelayScreenState {
  Widget _creator(MergeRelayRelaySnapshot snapshot) {
    final challenge = snapshot.preview;
    final payload = snapshot.sharePayload;
    if (challenge == null || payload == null) return _loading();
    return MergeRelaySharePanel(
      challenge: challenge,
      payload: payload,
      theme: widget.theme,
      message: snapshot.message,
      onShare: widget.controller.shareChallenge,
      onCopy: () => _copyCode(payload.code),
      onHome: widget.game.openHome,
    );
  }

  Widget _play(MergeRelayRelaySnapshot snapshot) {
    final attempt = snapshot.attempt;
    if (attempt == null) return _loading();
    final canFinish = attempt.moves.isNotEmpty;
    final budget = attempt.maxLegalMoves - attempt.moves.length;
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _header('Relay board', '$budget moves left.'),
          const SizedBox(height: 12),
          SizedBox.square(
            dimension: _boardSize(context),
            child: _RelayBoard(
              state: attempt.checkpoint.state,
              theme: widget.theme,
              onMove: snapshot.phase == MergeRelayRelayPhase.playing
                  ? widget.controller.move
                  : null,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'Score ${attempt.checkpoint.state.score} · move ${attempt.moves.length} of ${attempt.maxLegalMoves}',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: widget.theme.muted,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          if (snapshot.pendingMove != null)
            Text(
              'Move ${snapshot.pendingMove!.name} is waiting for the relay.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: widget.theme.coral,
                fontWeight: FontWeight.w800,
              ),
            ),
          if (snapshot.phase == MergeRelayRelayPhase.offline ||
              snapshot.phase == MergeRelayRelayPhase.conflict)
            OutlinedButton.icon(
              onPressed: snapshot.pendingMove == null
                  ? widget.controller.reconnect
                  : widget.controller.retryPending,
              icon: const Icon(Icons.refresh_rounded),
              label: Text(
                snapshot.pendingMove == null ? 'Reconnect' : 'Retry move',
              ),
            ),
          if (canFinish)
            OutlinedButton(
              onPressed: snapshot.phase == MergeRelayRelayPhase.playing
                  ? () => _confirmFinish(snapshot, sendBack: false)
                  : null,
              child: Text(budget > 0 ? 'Finish early' : 'Submit relay'),
            ),
          if (canFinish && budget > 0)
            TextButton(
              onPressed: snapshot.phase == MergeRelayRelayPhase.playing
                  ? () => _confirmFinish(snapshot, sendBack: true)
                  : null,
              child: const Text('Finish & send it back'),
            ),
        ],
      ),
    );
  }

  Widget _result(MergeRelayRelaySnapshot snapshot) {
    final result = snapshot.result;
    if (result == null) return _loading();
    final replayState = snapshot.replayState;
    final board =
        replayState?.board ?? snapshot.attempt?.checkpoint.state.board;
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _header(
            'Relay result',
            _MergeRelayRelayScreenState._resultLabel(result.outcome),
          ),
          const SizedBox(height: 18),
          if (board != null)
            SizedBox.square(
              dimension: _boardSize(context),
              child: _RelayBoard(
                state: replayState ?? snapshot.attempt!.checkpoint.state,
                theme: widget.theme,
                onMove: null,
              ),
            ),
          const SizedBox(height: 16),
          Text(
            '${result.finalScore}',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: widget.theme.ink,
              fontSize: 62,
              fontWeight: FontWeight.w900,
            ),
          ),
          Text(
            '+${result.scoreDelta} points · best ${result.maxTile} · '
            '${result.movesUsed} moves',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: widget.theme.muted,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 22),
          if (snapshot.replay == null)
            FilledButton.icon(
              onPressed: widget.controller.watchReplay,
              icon: const Icon(Icons.play_circle_outline_rounded),
              label: const Text('Watch replay'),
            )
          else ...[
            Text(
              'Move ${snapshot.replayStep} of ${snapshot.replay!.moves}',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: widget.theme.muted,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: snapshot.replayPlaying
                        ? widget.controller.pauseReplay
                        : widget.controller.watchReplay,
                    icon: Icon(
                      snapshot.replayPlaying
                          ? Icons.pause_rounded
                          : Icons.play_arrow_rounded,
                    ),
                    label: Text(
                      snapshot.replayPlaying ? 'Pause' : 'Play replay',
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: snapshot.replayStep < snapshot.replay!.moves
                      ? widget.controller.stepReplay
                      : null,
                  child: const Text('Step'),
                ),
              ],
            ),
            TextButton(
              onPressed: widget.controller.closeReplay,
              child: const Text('Close replay'),
            ),
          ],
          if (snapshot.returnChallenge != null ||
              snapshot.result?.returnChallengeId != null)
            OutlinedButton.icon(
              onPressed: widget.controller.shareReturn,
              icon: const Icon(Icons.reply_rounded),
              label: const Text('Share return relay'),
            ),
          OutlinedButton(
            onPressed: widget.game.openHome,
            child: const Text('Home'),
          ),
        ],
      ),
    );
  }

  Widget _error(MergeRelayRelaySnapshot snapshot) => _message(
    'The relay paused.',
    snapshot.message ?? 'Try again when you are ready.',
    snapshot.errorCode == 'preview_failed' ? 'Back' : 'Retry',
    snapshot.errorCode == 'preview_failed'
        ? widget.game.openHome
        : widget.controller.retry,
  );

  Widget _loading() => const Center(child: CircularProgressIndicator());

  double _boardSize(BuildContext context) =>
      (MediaQuery.sizeOf(context).width - 32).clamp(180, 420).toDouble();

  Future<void> _confirmFinish(
    MergeRelayRelaySnapshot snapshot, {
    required bool sendBack,
  }) async {
    final accepted = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(sendBack ? 'Pass it back?' : 'Finish this handoff?'),
        content: Text(
          sendBack
              ? 'Your moves will be sealed and a return board will be ready to share.'
              : 'Your moves will be sealed at this board.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep playing'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(sendBack ? 'Pass it back' : 'Finish'),
          ),
        ],
      ),
    );
    if (accepted == true && mounted) {
      await widget.controller.finalize(
        finishEarly:
            snapshot.attempt!.moves.length < snapshot.attempt!.maxLegalMoves,
        returnAlias: sendBack ? 'You' : null,
      );
    }
  }

  void _copyCode(String code) {
    Clipboard.setData(ClipboardData(text: code));
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Challenge code copied.')));
  }
}
