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
import 'package:flutter/services.dart' show AssetBundle, rootBundle;
import 'package:ludo_rules/ludo_rules.dart' show LudoColor;

import '../audio/ludo_audio_service.dart' show LudoFeedbackService;
import '../audio/ludo_haptics.dart' show LudoFeedbackEvent;
import '../game/ludo_board_geometry.dart';
import '../game/ludo_capture_particles.dart';
import '../game/ludo_confetti.dart';
import '../game/ludo_dice_component.dart';
import '../game/ludo_home_arrival_burst.dart';
import '../game/ludo_token_component.dart';
import '../theme/ludo_background_painter.dart' show LudoBackgroundPainter;

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

/// Fallback painter for the stacked brand logo slot (emblem-over-wordmark):
/// a simple gold ring on the deep-blue design-system fill, used only when
/// no `assets/art/logo_stacked.png` bitmap is bundled.
void _logoStackedVisual(Canvas canvas, Rect rect) {
  final center = rect.center;
  final radius = rect.shortestSide * 0.32;
  canvas.drawCircle(
    center,
    radius,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = rect.shortestSide * 0.05
      ..color = const Color(0xFFE2B93B),
  );
  canvas.drawCircle(
    center,
    radius * 0.28,
    Paint()..color = const Color(0xFFE2B93B),
  );
}

/// Fallback painter for the wide brand logo slot (orbit wordmark): a thin
/// gold ellipse standing in for the wordmark, used only when no
/// `assets/art/logo_wide.png` bitmap is bundled.
void _logoWideVisual(Canvas canvas, Rect rect) {
  final oval = Rect.fromCenter(
    center: rect.center,
    width: rect.width * 0.9,
    height: rect.height * 0.5,
  );
  canvas.drawOval(
    oval,
    Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = rect.shortestSide * 0.12
      ..color = const Color(0xFFE2B93B),
  );
}

/// Fallback painter for the lobby background slot (task 12h): delegates to
/// the existing [LudoBackgroundPainter] every other screen already renders
/// with, used only when no `assets/art/bg-b.png` bitmap is bundled.
void _lobbyBackgroundFallback(Canvas canvas, Rect rect) {
  const LudoBackgroundPainter().paint(canvas, rect.size);
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

  /// The stacked brand mark (emblem over wordmark) — splash screen and
  /// onboarding welcome hero. Bitmap: `assets/art/logo_stacked.png`.
  static const String logoStackedSlot = 'logo_stacked';
  static const LudoVisualSlot logoStacked = _logoStackedVisual;

  /// The wide orbit wordmark — home lobby header. Bitmap:
  /// `assets/art/logo_wide.png`.
  static const String logoWideSlot = 'logo_wide';
  static const LudoVisualSlot logoWide = _logoWideVisual;

  /// The home lobby's full-bleed background art (task 12h). Bitmap:
  /// `assets/art/bg-b.png` — the user-approved "vortex galaxy" background
  /// from `.agents/resources/2026-09-25/ludo-vortex-art/lobby/`, optimized
  /// into this package. The fallback below delegates to
  /// [LudoBackgroundPainter], the same code-drawn painter every other
  /// screen already renders with, so the lobby never regresses to a
  /// blank/mismatched fill on a build without this bitmap bundled.
  static const String lobbyBackgroundSlot = 'bg-b';
  static const LudoVisualSlot lobbyBackground = _lobbyBackgroundFallback;

  /// One mode-tile art slot per home lobby card (task 12h). Bitmaps:
  /// `assets/art/tile-a-computer.png`, `tile-a-pass.png`,
  /// `tile-a-friends.png`, `tile-a-online.png` — the user-approved "Style
  /// A" tile set from the same lobby art session. Each falls back to
  /// `home_lobby_screen.dart`'s existing code-drawn glyph painter
  /// (`_LobbyGlyphPainter`) when its bitmap isn't bundled.
  static const String lobbyTileComputerSlot = 'tile-a-computer';
  static const String lobbyTilePassAndPlaySlot = 'tile-a-pass';
  static const String lobbyTileFriendsSlot = 'tile-a-friends';
  static const String lobbyTileOnlineSlot = 'tile-a-online';

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

  /// The bitmap asset path a given [slot] name resolves to, if a human art
  /// session ever fills it in: `assets/art/<slot>.png`. This task adds no
  /// files at this path — [hasBitmap] resolves `false` for every slot
  /// until a later art session does.
  static String bitmapAssetPath(String slot) => 'assets/art/$slot.png';

  /// Whether a bitmap override exists for [slot], checked by attempting to
  /// load `assets/art/<slot>.png` from [bundle] (default: [rootBundle]).
  /// Tests may pass a fake [AssetBundle] to exercise the present-bitmap
  /// path without adding a real asset file to this package.
  ///
  /// A present-but-empty/corrupt asset still counts as "present" here —
  /// this only answers "does the slot resolve to bytes", not "are the
  /// bytes valid image data"; [LudoArtSlot] surfaces a decode failure the
  /// normal way `Image.asset` would.
  static Future<bool> hasBitmap(String slot, {AssetBundle? bundle}) async {
    final assetBundle = bundle ?? rootBundle;
    try {
      await assetBundle.load(bitmapAssetPath(slot));
      return true;
    } on Object {
      return false;
    }
  }
}

/// Renders a named art-manifest [slot]: a bitmap at `assets/art/<slot>.png`
/// when [LudoArtManifest.hasBitmap] finds one, otherwise the slot's
/// existing code-drawn [LudoVisualSlot] fallback painter — so a slot can
/// be upgraded to real bitmap art later without any gameplay code change.
class LudoArtSlot extends StatefulWidget {
  const LudoArtSlot({
    super.key,
    required this.slot,
    required this.fallbackPainter,
    this.size = const Size.square(64),
    this.bundle,
    this.fit = BoxFit.contain,
  });

  /// Slot name; resolves to `assets/art/<slot>.png`.
  final String slot;

  /// Existing code-drawn painter used when no bitmap is present.
  final LudoVisualSlot fallbackPainter;

  final Size size;

  /// How the bitmap (when present) fits [size] — every pre-task-12h slot
  /// is a logo/icon meant to fit entirely within its box
  /// ([BoxFit.contain], the default), but a full-bleed background slot
  /// (task 12h's lobby background) passes [BoxFit.cover] instead so it
  /// fills its box with no letterboxing.
  final BoxFit fit;

  /// Overrides [rootBundle] — tests use this to exercise the
  /// present-bitmap path without a real asset file.
  final AssetBundle? bundle;

  @override
  State<LudoArtSlot> createState() => _LudoArtSlotState();
}

class _LudoArtSlotState extends State<LudoArtSlot> {
  late Future<bool> _hasBitmap;

  @override
  void initState() {
    super.initState();
    _hasBitmap = LudoArtManifest.hasBitmap(widget.slot, bundle: widget.bundle);
  }

  @override
  void didUpdateWidget(covariant LudoArtSlot oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.slot != widget.slot || oldWidget.bundle != widget.bundle) {
      _hasBitmap = LudoArtManifest.hasBitmap(
        widget.slot,
        bundle: widget.bundle,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: _hasBitmap,
      builder: (context, snapshot) {
        final usesBitmap = snapshot.data ?? false;
        if (usesBitmap) {
          return Image.asset(
            LudoArtManifest.bitmapAssetPath(widget.slot),
            bundle: widget.bundle,
            width: widget.size.width,
            height: widget.size.height,
            fit: widget.fit,
          );
        }
        return CustomPaint(
          size: widget.size,
          painter: _FallbackPainter(widget.fallbackPainter),
        );
      },
    );
  }
}

class _FallbackPainter extends CustomPainter {
  const _FallbackPainter(this.paintSlot);

  final LudoVisualSlot paintSlot;

  @override
  void paint(Canvas canvas, Size size) {
    paintSlot(canvas, Offset.zero & size);
  }

  @override
  bool shouldRepaint(covariant _FallbackPainter oldDelegate) =>
      oldDelegate.paintSlot != paintSlot;
}
