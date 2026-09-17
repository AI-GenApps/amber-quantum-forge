import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:meme_court/meme_court_app.dart';
import 'package:meme_court/meme_court_content.dart';
import 'package:meme_court/meme_court_ui.dart';
import 'package:platform_core/platform_core.dart';

void main() {
  testWidgets('practice docket shows and awards the selected captions', (
    tester,
  ) async {
    _setLargeViewport(tester);
    final store = MemorySaveStore();
    await tester.pumpWidget(MemeCourtApp(saveStore: store));
    await tester.pumpAndSettle();

    expect(find.text(courtPracticePrompt.text), findsOneWidget);
    final aliceCaption = courtPracticePrompt.captions[0];
    final beaCaption = courtPracticePrompt.captions[1];
    await tester.tap(find.byType(CourtCaptionTile).at(0));
    await tester.pump();
    expect(
      find.descendant(
        of: find.byType(CourtCaptionTile).at(0),
        matching: find.text(aliceCaption.text),
      ),
      findsOneWidget,
    );
    expect(find.text('On the docket'), findsOneWidget);

    await tester.ensureVisible(find.byType(CourtCaptionTile).at(4));
    await tester.tap(find.byType(CourtCaptionTile).at(4));
    await tester.pumpAndSettle();
    expect(
      find.descendant(
        of: find.byType(CourtCaptionTile).at(4),
        matching: find.text(beaCaption.text),
      ),
      findsOneWidget,
    );
    expect(find.text('2 of 2 captions ready'), findsOneWidget);

    final saved = await store.read(
      runtimeAppContext(identity: memeCourtIdentity),
    );
    expect(saved?.payload['flow_version'], 2);
    expect(saved?.payload['prompt_id'], courtPracticePrompt.id);
    expect(saved?.payload['selected_phrase_ids'], {
      'sample_alice': aliceCaption.id,
      'sample_bea': beaCaption.id,
    });

    await tester.ensureVisible(find.text('Freeze the captions'));
    await tester.tap(find.text('Freeze the captions'));
    await tester.pump();
    await tester.tap(find.text('Open the vote'));
    await tester.pump();
    expect(find.text(aliceCaption.text), findsOneWidget);
    expect(find.text(beaCaption.text), findsOneWidget);

    await tester.tap(find.text('Alice’s caption'));
    await tester.pump();
    await tester.tap(find.text('Reveal the verdict'));
    await tester.pump();

    expect(find.text('Verdict'), findsOneWidget);
    expect(find.text('Alice’s caption takes the bench'), findsOneWidget);
    expect(find.text('“${aliceCaption.text}”'), findsOneWidget);
  });

  testWidgets('saved caption choices resume after reopening', (tester) async {
    _setLargeViewport(tester);
    final store = MemorySaveStore();
    await tester.pumpWidget(
      MemeCourtApp(key: const ValueKey('reopened'), saveStore: store),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.byType(CourtCaptionTile).at(0));
    await tester.pumpAndSettle();

    await tester.pumpWidget(MemeCourtApp(saveStore: store));
    await tester.pumpAndSettle();

    expect(find.text('Back to the docket.'), findsOneWidget);
    expect(
      find.descendant(
        of: find.byType(CourtCaptionTile).at(0),
        matching: find.text(courtPracticePrompt.captions[0].text),
      ),
      findsOneWidget,
    );
    expect(find.text('1 of 2 captions ready'), findsOneWidget);
    expect(find.text(courtLegacyCaptionText), findsNothing);

    await tester.tap(find.byTooltip('Start over'));
    await tester.pumpAndSettle();
    expect(find.text('Start over?'), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(find.text('1 of 2 captions ready'), findsOneWidget);

    await tester.tap(find.byTooltip('Start over'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Start over'));
    await tester.pumpAndSettle();
    expect(find.text('New round. Make it count.'), findsOneWidget);
    expect(find.text('0 of 2 captions ready'), findsOneWidget);
  });

  testWidgets('flow one saves retain the legacy caption label', (tester) async {
    _setLargeViewport(tester);
    final store = MemorySaveStore();
    final context = runtimeAppContext(identity: memeCourtIdentity);
    await store.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026, 1, 1),
        payload: {
          'flow_version': 1,
          'submitted_members': ['sample_alice'],
          'frozen': false,
          'voted_submission_id': null,
          'finalized': false,
        },
      ),
    );
    await tester.pumpWidget(MemeCourtApp(saveStore: store));
    await tester.pumpAndSettle();

    expect(find.text(courtLegacyCaptionText), findsOneWidget);
    expect(find.text('1 of 2 captions ready'), findsOneWidget);
    expect(find.text('Back to the docket.'), findsOneWidget);
  });

  testWidgets('flow two frozen saves keep the open-vote step', (tester) async {
    _setLargeViewport(tester);
    final store = MemorySaveStore();
    final context = runtimeAppContext(identity: memeCourtIdentity);
    await store.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026, 1, 1),
        payload: {
          'flow_version': 2,
          'prompt_id': courtPracticePrompt.id,
          'submitted_members': ['sample_alice', 'sample_bea'],
          'selected_phrase_ids': {
            'sample_alice': courtPracticePrompt.captions[0].id,
            'sample_bea': courtPracticePrompt.captions[1].id,
          },
          'round_status': 'frozen',
          'frozen': true,
          'voted_submission_id': null,
          'finalized': false,
        },
      ),
    );
    await tester.pumpWidget(MemeCourtApp(saveStore: store));
    await tester.pumpAndSettle();

    expect(find.text('Docket frozen'), findsOneWidget);
    expect(find.text('Open the vote'), findsOneWidget);
    expect(find.text('Alice’s caption'), findsNothing);
  });

  testWidgets('malformed frozen save starts fresh without partial state', (
    tester,
  ) async {
    _setLargeViewport(tester);
    final store = MemorySaveStore();
    final context = runtimeAppContext(identity: memeCourtIdentity);
    await store.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026, 1, 1),
        payload: {
          'flow_version': 1,
          'submitted_members': ['sample_alice'],
          'frozen': true,
          'voted_submission_id': 'not-a-submission',
          'finalized': false,
        },
      ),
    );
    await tester.pumpWidget(MemeCourtApp(saveStore: store));
    await tester.pumpAndSettle();

    expect(
      find.text('That docket was unreadable. Starting a clean round.'),
      findsOneWidget,
    );
    expect(find.text('0 of 2 captions ready'), findsOneWidget);
    expect(find.text('Vote now'), findsNothing);
    expect(find.text('Verdict'), findsNothing);
  });
}

void _setLargeViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 1200);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}
