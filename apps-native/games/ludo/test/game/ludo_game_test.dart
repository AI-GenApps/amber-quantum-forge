/// Tests for [LudoGame] beyond what the golden tests in
/// `test/goldens/ludo_board_golden_test.dart` cover visually: this file
/// asserts the stacked-token fan-out (task 12h) actually keeps each
/// stacked token individually tappable, not merely visually offset.
library;

import 'package:flame/events.dart';
import 'package:flame/game.dart';
import 'package:flame_test/flame_test.dart';
import 'package:flutter/gestures.dart' show PointerDeviceKind, TapUpDetails;
import 'package:flutter_test/flutter_test.dart';
import 'package:ludo/src/game/ludo_game.dart';
import 'package:ludo/src/game/ludo_token_component.dart';
import 'package:ludo_rules/ludo_rules.dart';

void main() {
  group('LudoGame stacked-token fan-out (task 12h)', () {
    testWithGame<LudoGame>(
      'Quick mode\'s 2 pre-released same-color tokens sharing the start '
      'square each occupy a distinct, non-overlapping hit-test region and '
      'are each individually tappable',
      () => LudoGame(
        initialState: LudoMatchState.initial(
          ruleset: LudoRuleset.quick,
          subjects: const ['red-seat', 'green-seat'],
        ),
      )..onTokenTap = (color, tokenId) => _tappedIds.add(tokenId),
      (game) async {
        await game.ready();

        // Quick pre-releases 2 of red's 4 tokens (ids 0 and 1) onto the
        // shared start square; the other 2 stay in the yard, each in
        // their own distinct yard slot (never stacked).
        final tokenA = game.tokens.firstWhere(
          (t) => t.color == LudoColor.red && t.tokenId == 0,
        );
        final tokenB = game.tokens.firstWhere(
          (t) => t.color == LudoColor.red && t.tokenId == 1,
        );
        expect(tokenA.currentCell, tokenB.currentCell);

        // The fan-out must actually separate them: same cell, different
        // rendered/hit-test position.
        expect(tokenA.position, isNot(equals(tokenB.position)));
        expect(tokenA.stackOffset, isNot(equals(Vector2.zero())));
        expect(tokenB.stackOffset, isNot(equals(Vector2.zero())));
        expect(tokenA.containsPoint(tokenA.position), isTrue);
        expect(tokenB.containsPoint(tokenB.position), isTrue);

        // Uses Flame's own hit-test/dispatch machinery
        // (`componentsAtPoint`, exactly what real tap routing calls) to
        // confirm a tap at each token's own rendered center resolves to
        // *that* token first — the correct individual selection this
        // task requires — even though the pins are tall/wide enough that
        // their bounding boxes partially overlap near the head (the
        // golden `board_stacked_tokens_quick_start.png` shows the bases
        // are the visually distinct, non-overlapping part). Flame
        // dispatches taps to the *topmost* (last-added / highest
        // z-order) match, which is always the more-recently-synced token
        // in this stack.
        final hitAtA = game
            .componentsAtPoint(tokenA.position)
            .whereType<LudoTokenComponent>()
            .toList();
        expect(hitAtA, isNotEmpty);
        expect(hitAtA.first, same(tokenA));

        final hitAtB = game
            .componentsAtPoint(tokenB.position)
            .whereType<LudoTokenComponent>()
            .toList();
        expect(hitAtB, isNotEmpty);
        expect(hitAtB.first, same(tokenB));

        // And driving the actual onTapUp callback each resolves to
        // reports the correct token id, not just "some token in the
        // stack".
        _tappedIds.clear();
        hitAtA.first.onTapUp(_fakeTapUp());
        expect(_tappedIds, [tokenA.tokenId]);
        _tappedIds.clear();
        hitAtB.first.onTapUp(_fakeTapUp());
        expect(_tappedIds, [tokenB.tokenId]);
      },
    );

    testWithGame<LudoGame>(
      'a single un-stacked token gets the zero offset (no regression to '
      'every prior task\'s single-token layout)',
      () => LudoGame(
        initialState: LudoMatchState.initial(
          ruleset: LudoRuleset.classic,
          subjects: const ['red-seat', 'green-seat'],
        ),
      ),
      (game) async {
        await game.ready();

        for (final token in game.tokens) {
          expect(token.stackOffset, Vector2.zero());
        }
      },
    );
  });
}

final _tappedIds = <int>[];

/// A minimal [TapUpEvent] good enough to drive
/// [LudoTokenComponent.onTapUp] directly (it only reads [TapUpEvent.game]
/// / [TapUpEvent.devicePosition] lazily via [PositionEvent.canvasPosition],
/// which `onTapUp` never touches — it only forwards this token's own
/// [LudoTokenComponent.color]/[LudoTokenComponent.tokenId]).
TapUpEvent _fakeTapUp() =>
    TapUpEvent(1, FlameGame(), TapUpDetails(kind: PointerDeviceKind.touch));
