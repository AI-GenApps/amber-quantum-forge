/// The "Pass to `<player>`" interstitial (task 12) shown between turns in a
/// local Pass N Play match.
///
/// All Ludo state is public (every seat's tokens are visible on the board
/// at all times) — this screen is a UX courtesy ("look away while the
/// device changes hands"), never an information-hiding mechanism, so it is
/// always dismissible and offers a "don't show again this session" toggle.
/// Reuses the same avatar/name identity `player_corner_card.dart` (task
/// 12d, superseding task 09's `player_panel.dart`) already renders for a
/// seat, rather than inventing a second identity presentation.
library;

import 'package:flutter/material.dart';

import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart';
import '../widgets/ludo_avatar.dart' show LudoAvatarView;
import '../widgets/ludo_panel.dart';

const _minTapTarget = 48.0;

/// A full-screen "Pass to `<player>`" interstitial. Tapping Ready (or the
/// whole card) calls [onContinue] with whether "don't show again this
/// session" was checked at that moment; this widget holds no session-level
/// state itself — the caller (`game_board_screen.dart`) owns suppressing
/// future interstitials for the rest of the running session.
class PassAndPlayInterstitial extends StatefulWidget {
  const PassAndPlayInterstitial({
    super.key,
    required this.playerName,
    required this.avatarId,
    required this.onContinue,
  });

  /// The seat about to play, e.g. from `LudoSeatIdentity.name`.
  final String playerName;

  /// The seat's avatar id, e.g. from `LudoSeatIdentity.avatarId`.
  final String avatarId;

  /// Invoked once, with `true` when "Don't show again this session" was
  /// checked, `false` otherwise.
  final ValueChanged<bool> onContinue;

  @override
  State<PassAndPlayInterstitial> createState() =>
      _PassAndPlayInterstitialState();
}

class _PassAndPlayInterstitialState extends State<PassAndPlayInterstitial> {
  bool _dontShowAgain = false;

  void _continue() => widget.onContinue(_dontShowAgain);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LudoBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Spacer(),
                Semantics(
                  label: 'Pass the device to ${widget.playerName}',
                  excludeSemantics: true,
                  child: LudoPanel(
                    padding: const EdgeInsets.all(LudoThemeTokens.spaceLg),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        LudoAvatarView(avatarId: widget.avatarId, size: 96),
                        const SizedBox(height: 16),
                        LudoOutlinedTitle(
                          'Pass to ${widget.playerName}',
                          style: LudoTextStyles.displaySmall,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Hand the device to ${widget.playerName} and tap '
                          'Ready when they have it.',
                          textAlign: TextAlign.center,
                          style: LudoTextStyles.body,
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                Semantics(
                  toggled: _dontShowAgain,
                  label: "Don't show this again this session",
                  excludeSemantics: true,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: _minTapTarget),
                    child: CheckboxListTile(
                      key: const Key('pass-and-play-dont-show-again'),
                      value: _dontShowAgain,
                      title: Text(
                        "Don't show this again this session",
                        style: LudoTextStyles.body,
                      ),
                      controlAffinity: ListTileControlAffinity.leading,
                      checkColor: LudoThemeTokens.textOutline,
                      activeColor: LudoThemeTokens.gold,
                      onChanged: (value) =>
                          setState(() => _dontShowAgain = value ?? false),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                ConstrainedBox(
                  constraints: const BoxConstraints(minHeight: _minTapTarget),
                  child: SizedBox(
                    width: double.infinity,
                    child: Ludo3dButton(
                      key: const Key('pass-and-play-ready-button'),
                      semanticLabel: 'Ready',
                      onPressed: _continue,
                      child: const Text(
                        'Ready',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
