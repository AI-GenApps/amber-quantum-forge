/// The 12 original per-tier expressions drawn on top of every tile numeral
/// (task 08). Each tier gets a distinct eye/mouth combination that reads as
/// progressively more delighted as the tier climbs — sleepy at low tiers,
/// euphoric at the top — built from simple vector primitives (arcs, circles,
/// a small star) rather than any licensed character design.
enum MrEyeStyle { sleepy, oval, round, wide, crescentUp, star }

enum MrMouthStyle { line, smallSmile, smile, openSmile, wideOpen, roundedO }

final class MrTileExpression {
  const MrTileExpression({
    required this.eyes,
    required this.mouth,
    this.blush = false,
    this.sparkle = false,
  });

  final MrEyeStyle eyes;
  final MrMouthStyle mouth;
  final bool blush;
  final bool sparkle;
}

/// One entry per tile tier index (0 = value 2 .. 11 = value 4096/"8192+"),
/// matching [MrTokens.tileTierColors]' 12 steps.
const List<MrTileExpression> mrTileExpressions = [
  MrTileExpression(eyes: MrEyeStyle.sleepy, mouth: MrMouthStyle.line),
  MrTileExpression(eyes: MrEyeStyle.sleepy, mouth: MrMouthStyle.smallSmile),
  MrTileExpression(eyes: MrEyeStyle.oval, mouth: MrMouthStyle.smallSmile),
  MrTileExpression(eyes: MrEyeStyle.oval, mouth: MrMouthStyle.smile),
  MrTileExpression(
    eyes: MrEyeStyle.round,
    mouth: MrMouthStyle.smile,
    blush: true,
  ),
  MrTileExpression(
    eyes: MrEyeStyle.round,
    mouth: MrMouthStyle.openSmile,
    blush: true,
  ),
  MrTileExpression(
    eyes: MrEyeStyle.wide,
    mouth: MrMouthStyle.openSmile,
    blush: true,
  ),
  MrTileExpression(
    eyes: MrEyeStyle.wide,
    mouth: MrMouthStyle.wideOpen,
    blush: true,
    sparkle: true,
  ),
  MrTileExpression(
    eyes: MrEyeStyle.crescentUp,
    mouth: MrMouthStyle.wideOpen,
    blush: true,
    sparkle: true,
  ),
  MrTileExpression(
    eyes: MrEyeStyle.crescentUp,
    mouth: MrMouthStyle.roundedO,
    blush: true,
    sparkle: true,
  ),
  MrTileExpression(
    eyes: MrEyeStyle.star,
    mouth: MrMouthStyle.roundedO,
    blush: true,
    sparkle: true,
  ),
  MrTileExpression(
    eyes: MrEyeStyle.star,
    mouth: MrMouthStyle.wideOpen,
    blush: true,
    sparkle: true,
  ),
];

/// Looks up the expression for a tier index, clamping to the last entry so
/// higher fallback tiers reuse the top ("legendary") face.
MrTileExpression mrExpressionForTierIndex(int tierIndex) {
  final clamped = tierIndex.clamp(0, mrTileExpressions.length - 1);
  return mrTileExpressions[clamped];
}
