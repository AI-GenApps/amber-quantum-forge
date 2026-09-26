import 'package:flutter/material.dart';

import 'mr_tokens.dart';

enum MrButtonVariant { primary, secondary }

/// A rounded, "press-down" chrome button (task 07): the whole button sinks
/// a few pixels and its shadow shrinks while held, springing back on
/// release — a tactile alternative to Material's flat ripple-only
/// `ElevatedButton`. [MrButtonVariant.primary] is a filled ink pill;
/// [MrButtonVariant.secondary] is an outlined pill.
final class MrButton extends StatefulWidget {
  const MrButton({
    required this.label,
    required this.onPressed,
    this.variant = MrButtonVariant.primary,
    this.icon,
    this.color,
    this.foreground,
    this.expand = true,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final MrButtonVariant variant;
  final IconData? icon;
  final Color? color;
  final Color? foreground;
  final bool expand;

  @override
  State<MrButton> createState() => _MrButtonState();
}

final class _MrButtonState extends State<MrButton> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final disabled = widget.onPressed == null;
    final ink = widget.color ?? MrTokens.ink;
    final isPrimary = widget.variant == MrButtonVariant.primary;
    final background = isPrimary
        ? ink.withValues(alpha: disabled ? 0.4 : 1)
        : Colors.transparent;
    final foreground = widget.foreground ?? (isPrimary ? MrTokens.paper : ink);
    final border = isPrimary
        ? null
        : Border.all(color: ink.withValues(alpha: disabled ? 0.3 : 0.5));

    final content = Row(
      mainAxisSize: widget.expand ? MainAxisSize.max : MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.icon != null) ...[
          Icon(
            widget.icon,
            color: foreground.withValues(alpha: disabled ? 0.6 : 1),
          ),
          const SizedBox(width: MrTokens.space2),
        ],
        // `Flexible` + ellipsis (task 11) rather than a bare `Text`: at a
        // large text scale on a narrow button (e.g. the pause panel's
        // "Restart run" at 2x on a 320px-wide compact layout), an
        // unconstrained label previously overflowed the button's Row —
        // this lets it truncate instead of throwing a RenderFlex overflow.
        Flexible(
          child: Text(
            widget.label,
            overflow: TextOverflow.ellipsis,
            softWrap: false,
            style: TextStyle(
              fontFamily: 'Fredoka',
              color: foreground.withValues(alpha: disabled ? 0.6 : 1),
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );

    return Semantics(
      button: true,
      enabled: !disabled,
      label: widget.label,
      child: GestureDetector(
        onTapDown: disabled ? null : (_) => _setPressed(true),
        onTapUp: disabled ? null : (_) => _setPressed(false),
        onTapCancel: disabled ? null : () => _setPressed(false),
        onTap: widget.onPressed,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 90),
          curve: Curves.easeOut,
          margin: EdgeInsets.only(top: _pressed ? 4 : 0),
          padding: const EdgeInsets.symmetric(
            horizontal: MrTokens.space5,
            vertical: MrTokens.space4,
          ),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(MrTokens.radiusMedium),
            border: border,
            boxShadow: isPrimary && !disabled && !_pressed
                ? MrTokens.cardShadow(opacity: 0.22)
                : null,
          ),
          child: content,
        ),
      ),
    );
  }
}
