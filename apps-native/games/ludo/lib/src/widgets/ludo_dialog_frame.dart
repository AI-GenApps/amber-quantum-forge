/// Wraps [LudoPanel] with dialog-appropriate sizing/padding, replacing raw
/// `AlertDialog` styling in later restyle tasks (task 12b).
library;

import 'package:flutter/material.dart';

import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import 'ludo_panel.dart';

/// A themed dialog frame: a [LudoPanel] sized for dialog content, with an
/// optional outlined title.
class LudoDialogFrame extends StatelessWidget {
  const LudoDialogFrame({
    super.key,
    required this.child,
    this.title,
    this.maxWidth = 360,
  });

  final Widget child;
  final String? title;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: LudoPanel(
          padding: const EdgeInsets.all(LudoThemeTokens.spaceLg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (title != null) ...[
                Center(
                  child: LudoOutlinedTitle(
                    title!,
                    style: LudoTextStyles.displaySmall,
                  ),
                ),
                const SizedBox(height: LudoThemeTokens.spaceMd),
              ],
              child,
            ],
          ),
        ),
      ),
    );
  }
}
