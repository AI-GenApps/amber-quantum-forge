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

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import '../audio/ludo_audio_service.dart' show LudoFeedbackService;
import '../audio/ludo_haptics.dart' show LudoFeedbackEvent;
import '../game/ludo_board_geometry.dart';
import '../game/ludo_capture_particles.dart';
import '../game/ludo_confetti.dart';
import '../game/ludo_dice_component.dart';
import '../game/ludo_home_arrival_burst.dart';
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

// Every visual slot now resolves to a real code-drawn component (task 04's
// board/token/home-stretch slots and this task's dice/particle/confetti
// slots), so no placeholder visual painter remains — only the audio slots
// (task 06) are still placeholders.

/// The real feedback service (task 06), attached once at app startup via
/// [LudoArtManifest.attachFeedback]. `null` until then, so every slot below
/// stays a silent no-op (matching this file's pre-task-06 contract) when
/// nothing has attached a service yet — e.g. in a unit test that renders
/// visuals without an audio service.
LudoFeedbackService? _feedback;

Future<void> _trigger(LudoFeedbackEvent event) async {
  await _feedback?.trigger(event);
}

Future<void> _sfxDiceRoll() => _trigger(LudoFeedbackEvent.diceRoll);
Future<void> _sfxTokenStep() => _trigger(LudoFeedbackEvent.tokenStep);
Future<void> _sfxCapture() => _trigger(LudoFeedbackEvent.capture);
Future<void> _sfxHome() => _trigger(LudoFeedbackEvent.homeArrival);
Future<void> _sfxWin() => _trigger(LudoFeedbackEvent.win);
Future<void> _sfxButton() => _trigger(LudoFeedbackEvent.buttonTap);
Future<void> _sfxTurnAlert() => _trigger(LudoFeedbackEvent.turnAlert);

Future<void> _musicLoop() async {
  await _feedback?.startMusic();
}

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

/// Paints one pip face (`1`..`6`), delegating to [LudoDicePainter] — the
/// same code path `LudoDiceComponent` renders with — so this slot and the
/// on-board die always draw identical art.
LudoVisualSlot _diceFaceVisual(int face) => (canvas, rect) {
  LudoDicePainter.paintFace(canvas, rect, face);
};

/// A single static frame representing the capture particle burst, drawn
/// with the same [ludoCaptureParticlePalette] the live
/// `LudoCaptureBurstComponent` uses, so this slot never drifts from the
/// real effect's color scheme.
void _captureParticleVisual(Canvas canvas, Rect rect) {
  final center = rect.center;
  final reach = rect.shortestSide * 0.4;
  for (var i = 0; i < 8; i++) {
    final angle = (2 * math.pi * i) / 8;
    final offset = center.translate(
      reach * (i.isEven ? 1 : 0.6) * math.cos(angle),
      reach * (i.isEven ? 1 : 0.6) * math.sin(angle),
    );
    canvas.drawCircle(
      offset,
      rect.shortestSide * 0.05,
      Paint()
        ..color =
            ludoCaptureParticlePalette[i % ludoCaptureParticlePalette.length],
    );
  }
}

/// A single static frame representing the home-arrival particle burst,
/// drawn with the same [ludoHomeArrivalPalette] the live
/// `LudoHomeArrivalBurstComponent` uses — an upward fan rather than the
/// capture slot's flat radial ring, so the two slots stay visually
/// distinct too.
void _homeArrivalParticleVisual(Canvas canvas, Rect rect) {
  final origin = rect.bottomCenter;
  final reach = rect.shortestSide * 0.45;
  for (var i = 0; i < 8; i++) {
    final spread = (i / 8 - 0.5) * math.pi * 0.9;
    final offset = origin.translate(
      reach * math.sin(spread),
      -reach * math.cos(spread),
    );
    canvas.drawCircle(
      offset,
      rect.shortestSide * 0.05,
      Paint()
        ..color = ludoHomeArrivalPalette[i % ludoHomeArrivalPalette.length],
    );
  }
}

/// A single static frame representing the win-confetti celebration, drawn
/// with the same [ludoConfettiPalette] the live `LudoConfettiComponent`
/// uses.
void _confettiVisual(Canvas canvas, Rect rect) {
  for (var i = 0; i < ludoConfettiPalette.length; i++) {
    final x = rect.left + rect.width * (i + 0.5) / ludoConfettiPalette.length;
    final y = rect.top + rect.height * (0.25 + 0.1 * (i.isEven ? 0 : 1));
    canvas.drawCircle(
      Offset(x, y),
      rect.shortestSide * 0.045,
      Paint()..color = ludoConfettiPalette[i],
    );
  }
}

/// Named-slot registry for every Ludo visual/audio asset.
///
/// See the doc comment at the top of this file for the contract every slot
/// follows.
abstract final class LudoArtManifest {
  // Visual slots. Board/token/home-stretch slots (task 04) and
  // dice/particle/confetti slots (task 05) all resolve to the real
  // code-drawn components in `lib/src/game/`.

  /// The board's background/track art.
  static const LudoVisualSlot boardBackground = _boardBackgroundVisual;

  /// One token slot per player color.
  static final Map<LudoTokenColor, LudoVisualSlot> token = {
    for (final color in LudoTokenColor.values) color: _tokenVisual(color),
  };

  /// Dice face art, indexed `0`..`5` for pips `1`..`6`.
  static final List<LudoVisualSlot> diceFace = [
    for (var face = 1; face <= 6; face++) _diceFaceVisual(face),
  ];

  /// One home-stretch lane slot per player color.
  static final Map<LudoTokenColor, LudoVisualSlot> homeStretch = {
    for (final color in LudoTokenColor.values) color: _homeStretchVisual(color),
  };

  /// Capture particle burst, played when a token sends an opponent home.
  /// The live effect is [LudoCaptureBurstComponent]; this slot is a single
  /// representative frame in the same palette.
  static const LudoVisualSlot captureParticle = _captureParticleVisual;

  /// Home-arrival particle burst, played when a token reaches home. The
  /// live effect is [LudoHomeArrivalBurstComponent]; this slot is a single
  /// representative frame in the same (warmer) palette.
  static const LudoVisualSlot homeArrivalParticle = _homeArrivalParticleVisual;

  /// Win confetti, played when a match ends. The live effect is
  /// [LudoConfettiComponent]; this slot is a single representative frame
  /// in the same palette.
  static const LudoVisualSlot confetti = _confettiVisual;

  // Audio slots — each resolves to the real `LudoFeedbackService` (SFX +
  // haptics together, see `ludo_audio_service.dart`) once
  // [attachFeedback] has been called; until then (e.g. in a visuals-only
  // test) every slot stays a silent no-op, matching this file's original
  // contract.

  /// Plays when the dice is rolled.
  static const LudoAudioSlot sfxDiceRoll = _sfxDiceRoll;

  /// Plays for each board step a token hops.
  static const LudoAudioSlot sfxTokenStep = _sfxTokenStep;

  /// Plays when a token captures an opponent.
  static const LudoAudioSlot sfxCapture = _sfxCapture;

  /// Plays when a token reaches home.
  static const LudoAudioSlot sfxHome = _sfxHome;

  /// Plays when a match is won.
  static const LudoAudioSlot sfxWin = _sfxWin;

  /// Plays on a generic UI button press.
  static const LudoAudioSlot sfxButton = _sfxButton;

  /// Plays to alert the current player it is their turn.
  static const LudoAudioSlot sfxTurnAlert = _sfxTurnAlert;

  /// Looping background music.
  static const LudoAudioSlot musicLoop = _musicLoop;

  /// Attaches (or, with `null`, detaches) the real feedback service every
  /// audio slot above delegates to. Call once at app startup (a later
  /// screens task wires this into `lib/src/app.dart`); tests may attach a
  /// fake [LudoFeedbackService] built from fakes, or leave it detached to
  /// keep audio slots as silent no-ops.
  static void attachFeedback(LudoFeedbackService? feedback) {
    _feedback = feedback;
  }
}
