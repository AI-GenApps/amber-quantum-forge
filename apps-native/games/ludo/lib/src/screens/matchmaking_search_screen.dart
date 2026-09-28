/// The random-matchmaking "Finding players..." screen (task 26): shows a
/// cancelable searching state driven by a [LudoOnlineWait] (from
/// `LudoOnlineController.startMatchmaking`/`awaitRoomFilled`), and pops
/// with the resulting [LudoOnlineMatchReadyResult] once matched, or `null`
/// once cancelled or failed.
library;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show Clipboard, ClipboardData;
import 'package:share_plus/share_plus.dart' show Share;

import '../net/ludo_online_controller.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart';
import '../widgets/ludo_panel.dart';
import '../widgets/ludo_searching_indicator.dart' show LudoSearchingIndicator;

const _minTapTarget = 48.0;

/// Pushes [MatchmakingSearchScreen] for [wait] and returns the eventual
/// ready match, or `null` if the search was cancelled or failed.
class MatchmakingSearchScreen extends StatefulWidget {
  const MatchmakingSearchScreen({
    super.key,
    required this.wait,
    this.title = 'Finding players...',
    this.roomCode,
    this.inviteLink,
    this.shareInviteLink,
  });

  final LudoOnlineWait wait;

  /// Shown while searching; distinguishes a matchmaking search
  /// ("Finding players...") from a room-fill wait ("Waiting for a
  /// friend...") using the exact same screen.
  final String title;

  /// A just-created room's code, shown as a legible chip with copy/share
  /// affordances (task 26x's "clearly legible room code" polish target)
  /// above the searching indicator. `null` (the default) for a
  /// matchmaking search, which has no room code to show.
  final String? roomCode;

  /// The full shareable invite link backing [roomCode]'s share button.
  /// Required whenever [roomCode] is set.
  final String? inviteLink;

  /// Test seam for the share button: overrides the native share-sheet
  /// call. `null` (the default) in production, where it calls
  /// `Share.share`.
  final Future<void> Function(String inviteLink)? shareInviteLink;

  static Future<LudoOnlineMatchReadyResult?> show(
    BuildContext context,
    LudoOnlineWait wait, {
    String title = 'Finding players...',
    String? roomCode,
    String? inviteLink,
    Future<void> Function(String inviteLink)? shareInviteLink,
  }) {
    return Navigator.of(context).push<LudoOnlineMatchReadyResult?>(
      MaterialPageRoute(
        builder: (_) => MatchmakingSearchScreen(
          wait: wait,
          title: title,
          roomCode: roomCode,
          inviteLink: inviteLink,
          shareInviteLink: shareInviteLink,
        ),
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
  bool _justCopied = false;

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

  Future<void> _copyCode(String code) async {
    await Clipboard.setData(ClipboardData(text: code));
    if (!mounted) return;
    setState(() => _justCopied = true);
    unawaited(
      Future<void>.delayed(const Duration(seconds: 2)).then((_) {
        if (mounted) setState(() => _justCopied = false);
      }),
    );
  }

  Future<void> _shareLink(String inviteLink) async {
    try {
      await (widget.shareInviteLink ?? Share.share)(inviteLink);
    } on Object {
      // Best-effort, same as the auto-share on room create; a dismissed
      // or unavailable share sheet is not an error.
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
    if (widget.roomCode case final code?) ...[
      _RoomCodeChip(
        code: code,
        justCopied: _justCopied,
        onCopy: () => unawaited(_copyCode(code)),
        onShare: widget.inviteLink == null
            ? null
            : () => unawaited(_shareLink(widget.inviteLink!)),
      ),
      const SizedBox(height: 20),
    ],
    const LudoSearchingIndicator(),
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

/// A legible room-code display with copy and native-share affordances
/// (task 26x's "clearly legible room code" polish target), shown above the
/// searching indicator on the room-fill wait screen.
class _RoomCodeChip extends StatelessWidget {
  const _RoomCodeChip({
    required this.code,
    required this.justCopied,
    required this.onCopy,
    this.onShare,
  });

  final String code;
  final bool justCopied;
  final VoidCallback onCopy;
  final VoidCallback? onShare;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Room code',
          style: LudoTextStyles.body.copyWith(
            color: LudoThemeTokens.textOnDark.withValues(alpha: 0.7),
          ),
        ),
        const SizedBox(height: 8),
        DecoratedBox(
          decoration: BoxDecoration(
            color: LudoThemeTokens.backgroundDeepBlue,
            borderRadius: BorderRadius.circular(LudoThemeTokens.radiusSm),
            border: Border.all(color: LudoThemeTokens.gold, width: 2),
          ),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: LudoThemeTokens.spaceMd,
              vertical: LudoThemeTokens.spaceSm,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  code,
                  style: LudoTextStyles.displaySmall.copyWith(
                    fontSize: 22,
                    letterSpacing: 4,
                  ),
                ),
                const SizedBox(width: LudoThemeTokens.spaceSm),
                _RoomCodeIconButton(
                  key: const Key('room-code-copy-button'),
                  icon: justCopied ? Icons.check_rounded : Icons.copy_rounded,
                  semanticLabel: justCopied ? 'Copied' : 'Copy room code',
                  onPressed: onCopy,
                ),
                if (onShare != null)
                  _RoomCodeIconButton(
                    key: const Key('room-code-share-button'),
                    icon: Icons.ios_share_rounded,
                    semanticLabel: 'Share room code',
                    onPressed: onShare!,
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _RoomCodeIconButton extends StatelessWidget {
  const _RoomCodeIconButton({
    super.key,
    required this.icon,
    required this.semanticLabel,
    required this.onPressed,
  });

  final IconData icon;
  final String semanticLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: semanticLabel,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minWidth: _minTapTarget,
          minHeight: _minTapTarget,
        ),
        child: IconButton(
          onPressed: onPressed,
          icon: Icon(icon, color: LudoThemeTokens.gold),
        ),
      ),
    );
  }
}
