/// The random-matchmaking "Finding players..." screen (task 26): shows a
/// cancelable searching state driven by a [LudoOnlineWait] (from
/// `LudoOnlineController.startMatchmaking`/`awaitRoomFilled`), and pops
/// with the resulting [LudoOnlineMatchReadyResult] once matched, or `null`
/// once cancelled or failed.
library;

import 'dart:async';

import 'package:flutter/material.dart';

import '../net/ludo_online_controller.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart';
import '../widgets/ludo_panel.dart';

const _minTapTarget = 48.0;

/// Pushes [MatchmakingSearchScreen] for [wait] and returns the eventual
/// ready match, or `null` if the search was cancelled or failed.
class MatchmakingSearchScreen extends StatefulWidget {
  const MatchmakingSearchScreen({
    super.key,
    required this.wait,
    this.title = 'Finding players...',
  });

  final LudoOnlineWait wait;

  /// Shown while searching; distinguishes a matchmaking search
  /// ("Finding players...") from a room-fill wait ("Waiting for a
  /// friend...") using the exact same screen.
  final String title;

  static Future<LudoOnlineMatchReadyResult?> show(
    BuildContext context,
    LudoOnlineWait wait, {
    String title = 'Finding players...',
  }) {
    return Navigator.of(context).push<LudoOnlineMatchReadyResult?>(
      MaterialPageRoute(
        builder: (_) => MatchmakingSearchScreen(wait: wait, title: title),
      ),
    );
  }

  @override
  State<MatchmakingSearchScreen> createState() =>
      _MatchmakingSearchScreenState();
}

class _MatchmakingSearchScreenState extends State<MatchmakingSearchScreen> {
  bool _cancelling = false;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    unawaited(_awaitResult());
  }

  Future<void> _awaitResult() async {
    try {
      final ready = await widget.wait.result;
      if (mounted) Navigator.of(context).pop(ready);
    } on Object catch (error) {
      if (!mounted) return;
      final userCancelled = error is StateError && error.message == 'cancelled';
      if (userCancelled) {
        Navigator.of(context).pop();
      } else {
        setState(() => _failed = true);
      }
    }
  }

  Future<void> _cancel() async {
    if (_cancelling) return;
    setState(() => _cancelling = true);
    await widget.wait.cancel();
    // The pending `_awaitResult()` await above resolves the pop once
    // `wait.result` rejects with the "cancelled" StateError.
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) unawaited(_cancel());
      },
      child: Scaffold(
        body: LudoBackground(
          child: SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: LudoPanel(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: _failed
                        ? _failedContent(context)
                        : _searchingContent(context),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _searchingContent(BuildContext context) => [
    const SizedBox(
      width: 56,
      height: 56,
      child: CircularProgressIndicator(
        strokeWidth: 4,
        color: LudoThemeTokens.gold,
      ),
    ),
    const SizedBox(height: 20),
    Text(
      widget.title,
      style: LudoTextStyles.displaySmall,
      textAlign: TextAlign.center,
    ),
    const SizedBox(height: 24),
    ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _minTapTarget),
      child: SizedBox(
        width: double.infinity,
        child: Ludo3dButton(
          key: const Key('matchmaking-cancel-button'),
          semanticLabel: 'Cancel',
          onPressed: _cancelling ? null : () => unawaited(_cancel()),
          child: Text(_cancelling ? 'Cancelling...' : 'Cancel'),
        ),
      ),
    ),
  ];

  List<Widget> _failedContent(BuildContext context) => [
    const Icon(Icons.wifi_off_rounded, size: 48, color: LudoThemeTokens.gold),
    const SizedBox(height: 16),
    Text(
      "Couldn't reach the server",
      style: LudoTextStyles.displaySmall,
      textAlign: TextAlign.center,
    ),
    const SizedBox(height: 8),
    Text(
      'Check your connection and try again.',
      style: LudoTextStyles.body,
      textAlign: TextAlign.center,
    ),
    const SizedBox(height: 24),
    ConstrainedBox(
      constraints: const BoxConstraints(minHeight: _minTapTarget),
      child: SizedBox(
        width: double.infinity,
        child: Ludo3dButton(
          key: const Key('matchmaking-back-button'),
          semanticLabel: 'Back',
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Back'),
        ),
      ),
    ),
  ];
}
