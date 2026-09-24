/// Ludo art & audio manifest.
///
/// Contract: this file is the single named-slot registry for every visual
/// and audio asset the Ludo client needs. Gameplay code (screens, board,
/// game loop) references a slot by name from [LudoArtManifest] — it never
/// embeds a raw asset path or bitmap string literal.
///
/// Every slot's initial value is a **code-drawn** placeholder implementation
/// (a solid-color [CustomPainter]-style paint call for visuals, a silent
/// no-op for audio) so the app compiles and runs before any real art or
/// audio exists. Later, human-reviewed art/audio tasks fill each slot in:
///
/// - Board/token/dice/home-stretch/capture/confetti visuals are drawn with
///   Flame/CustomPainter code (tasks 04-05), not bitmaps.
/// - SFX and music are wired to a real audio service (task 06).
///
/// Swapping a slot for a bitmap asset path later means changing only this
/// file — gameplay code that references the slot by name does not change.
library;

import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import '../game/ludo_board_geometry.dart';
import '../game/ludo_token_component.dart';

/// Signature for a visual asset slot: paints the slot's art into [rect] on
/// [canvas]. Until a later task fills it in, every slot paints a solid
/// placeholder color so the board is visible but unstyled.
typedef LudoVisualSlot = void Function(Canvas canvas, Rect rect);

/// Signature for an audio asset slot: plays the slot's sound/music. Until
/// task 06 wires a real audio service, every slot is a silent no-op.
typedef LudoAudioSlot = Future<void> Function();

/// The four Ludo player colors, used to key the per-color slots
/// ([LudoArtManifest.token], [LudoArtManifest.homeStretch]).
///
/// Same names and order as `ludo_rules`' [LudoColor] (task 01's frozen seat
/// constants) — this enum exists only because the manifest predates this
/// task's dependency on the rules package; [ludoColorOf] converts between
/// the two by that shared order.
enum LudoTokenColor { red, green, yellow, blue }

/// Converts a manifest [LudoTokenColor] to the `ludo_rules` [LudoColor] it
/// names, by their shared declaration order.
LudoColor ludoColorOf(LudoTokenColor color) => LudoColor.values[color.index];

void _placeholderVisual(Canvas canvas, Rect rect) {
  canvas.drawRect(rect, Paint()..color = const Color(0xFFB0BEC5));
}

Future<void> _placeholderAudio() async {}

/// Paints the board's background using the same fill the real
/// [LudoBoardComponent] uses, so this manifest slot and the on-screen
/// board never drift apart.
void _boardBackgroundVisual(Canvas canvas, Rect rect) {
  canvas.drawRect(rect, Paint()..color = const Color(0xFFF5F5F0));
}

/// Paints one color's glossy token, delegating to [LudoTokenPainter] — the
/// same code path `LudoTokenComponent` renders with — so this slot and the
/// on-board token always draw identical art.
LudoVisualSlot _tokenVisual(LudoTokenColor color) => (canvas, rect) {
  LudoTokenPainter.paint(canvas, rect, ludoColorPalette[ludoColorOf(color)]!);
};

/// Paints one color's home-stretch lane fill, matching
/// `LudoHomeStretchCellComponent`'s tint.
LudoVisualSlot _homeStretchVisual(LudoTokenColor color) => (canvas, rect) {
  final base = ludoColorPalette[ludoColorOf(color)]!;
  canvas.drawRect(rect, Paint()..color = base.withValues(alpha: 0.55));
};

/// Named-slot registry for every Ludo visual/audio asset.
///
/// See the doc comment at the top of this file for the contract every slot
/// follows.
abstract final class LudoArtManifest {
  // Visual slots. Board/token/home-stretch slots (task 04) resolve to the
  // real code-drawn components in `lib/src/game/`; dice/particle/confetti
  // slots (task 05) remain placeholders.

  /// The board's background/track art.
  static const LudoVisualSlot boardBackground = _boardBackgroundVisual;

  /// One token slot per player color.
  static final Map<LudoTokenColor, LudoVisualSlot> token = {
    for (final color in LudoTokenColor.values) color: _tokenVisual(color),
  };

  /// Dice face art, indexed `0`..`5` for pips `1`..`6`.
  static const List<LudoVisualSlot> diceFace = [
    _placeholderVisual, // TODO(task-05): dice_face_1
    _placeholderVisual, // TODO(task-05): dice_face_2
    _placeholderVisual, // TODO(task-05): dice_face_3
    _placeholderVisual, // TODO(task-05): dice_face_4
    _placeholderVisual, // TODO(task-05): dice_face_5
    _placeholderVisual, // TODO(task-05): dice_face_6
  ];

  /// One home-stretch lane slot per player color.
  static final Map<LudoTokenColor, LudoVisualSlot> homeStretch = {
    for (final color in LudoTokenColor.values) color: _homeStretchVisual(color),
  };

  /// Capture particle burst, played when a token sends an opponent home.
  static const LudoVisualSlot captureParticle =
      _placeholderVisual; // TODO(task-05)

  /// Win confetti, played when a match ends.
  static const LudoVisualSlot confetti = _placeholderVisual; // TODO(task-05)

  // Audio slots — silent no-ops. TODO(task-06): wire a real audio service,
  // CC0 SFX/music, haptics, and sound settings.

  /// Plays when the dice is rolled.
  static const LudoAudioSlot sfxDiceRoll = _placeholderAudio; // TODO(task-06)

  /// Plays for each board step a token hops.
  static const LudoAudioSlot sfxTokenStep = _placeholderAudio; // TODO(task-06)

  /// Plays when a token captures an opponent.
  static const LudoAudioSlot sfxCapture = _placeholderAudio; // TODO(task-06)

  /// Plays when a token reaches home.
  static const LudoAudioSlot sfxHome = _placeholderAudio; // TODO(task-06)

  /// Plays when a match is won.
  static const LudoAudioSlot sfxWin = _placeholderAudio; // TODO(task-06)

  /// Plays on a generic UI button press.
  static const LudoAudioSlot sfxButton = _placeholderAudio; // TODO(task-06)

  /// Plays to alert the current player it is their turn.
  static const LudoAudioSlot sfxTurnAlert = _placeholderAudio; // TODO(task-06)

  /// Looping background music.
  static const LudoAudioSlot musicLoop = _placeholderAudio; // TODO(task-06)
}
