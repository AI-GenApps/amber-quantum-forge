import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:platform_core/platform_core.dart';
import 'package:snapquest/snapquest_app.dart';
import 'package:snapquest/snapquest_secondary_cards.dart';
import 'package:snapquest/capabilities/camera_capture_capability.dart';
import 'package:snapquest/capabilities/camera_capture_models.dart';
import 'package:snapquest_rules/snapquest_rules.dart';

void main() {
  testWidgets('desk hunt selects objects and reveals the next creature', (
    tester,
  ) async {
    _setLargeViewport(tester);
    await tester.pumpWidget(const SnapQuestApp());
    await tester.pumpAndSettle();

    expect(find.text('Peeklings'), findsOneWidget);
    expect(find.text('red'), findsOneWidget);
    expect(find.text('Red pebble'), findsOneWidget);
    expect(find.text('Blue shell'), findsOneWidget);

    await tester.tap(find.text('Blue shell'));
    await tester.pump();
    expect(find.textContaining('Find red.'), findsOneWidget);

    await tester.tap(find.text('Red pebble'));
    await tester.pump();
    expect(find.text('Emberling joined your album!'), findsOneWidget);
    expect(find.text('Emberling'), findsOneWidget);
    expect(find.byType(PeeklingArt), findsNWidgets(2));
    await _scrollToNextQuest(tester);
    expect(find.text('blue'), findsOneWidget);
    expect(find.textContaining('Azurling'), findsOneWidget);
    await tester.tap(find.text('Blue shell'));
    await tester.pumpAndSettle();
    expect(
      find.text('All hunts complete! Your Peeklings are growing.'),
      findsOneWidget,
    );
    expect(find.byType(PeeklingArt), findsNWidgets(2));
  });

  testWidgets('saved album resumes with the next target', (tester) async {
    _setLargeViewport(tester);
    final store = MemorySaveStore();
    await tester.pumpWidget(SnapQuestApp(saveStore: store));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Red pebble'));
    await tester.pumpAndSettle();

    final saved = await store.read(
      runtimeAppContext(identity: snapQuestIdentity),
    );
    expect(saved, isNotNull);
    await tester.pumpWidget(
      SnapQuestApp(key: const ValueKey('reopened'), saveStore: store),
    );
    await tester.pumpAndSettle();
    expect(find.text('Your collection is back.'), findsOneWidget);
    await _scrollToNextQuest(tester);
    expect(find.textContaining('Azurling'), findsOneWidget);
    expect(find.text('blue'), findsOneWidget);

    await tester.tap(find.byTooltip('Clear local album'));
    await tester.pumpAndSettle();
    expect(find.text('Clear the local album?'), findsOneWidget);
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(find.text('Your collection is back.'), findsOneWidget);
    expect(find.text('Emberling'), findsOneWidget);

    await tester.tap(find.byTooltip('Clear local album'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Clear album'));
    await tester.pumpAndSettle();
    expect(find.text('New hunt ready.'), findsOneWidget);
    expect(find.text('red'), findsOneWidget);
  });

  testWidgets('captured frame stays distinct from unverified recognition', (
    tester,
  ) async {
    _setLargeViewport(tester);
    await tester.pumpWidget(
      SnapQuestApp(
        cameraFactory: () => CameraCaptureCapability(source: _FrameSource()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Try the camera'));
    await tester.pumpAndSettle();

    expect(find.text('Desk match next.'), findsOneWidget);
    expect(find.text('No camera here. Try the desk match.'), findsNothing);
  });

  testWidgets('accepted camera result with wrong descriptor cannot award', (
    tester,
  ) async {
    _setLargeViewport(tester);
    await tester.pumpWidget(
      SnapQuestApp(cameraFactory: () => _MismatchedCapture()),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Try the camera'));
    await tester.pumpAndSettle();

    expect(find.text('That snapshot needs a desk match.'), findsOneWidget);
    expect(find.text('Camera reward added.'), findsNothing);
    expect(find.text('Emberling joined your album!'), findsNothing);
  });

  testWidgets('camera action is disabled while capture is pending', (
    tester,
  ) async {
    _setLargeViewport(tester);
    final capture = _BlockingCapture();
    await tester.pumpWidget(SnapQuestApp(cameraFactory: () => capture));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Try the camera'));
    await tester.pump();

    final button = tester.widget<OutlinedButton>(find.byType(OutlinedButton));
    expect(button.onPressed, isNull);
    expect(capture.calls, 1);
    capture.complete(
      RecognitionObservation(
        status: CaptureStatus.lowQuality,
        mode: CaptureMode.camera,
        questId: 'daily-red',
        questVersion: 3,
        descriptorId: null,
        quality: 0,
        observedAt: DateTime.utc(2026, 1, 1),
      ),
    );
    await tester.pumpAndSettle();
    expect(capture.calls, 1);
  });

  testWidgets('inconsistent album state falls back to a fresh hunt', (
    tester,
  ) async {
    _setLargeViewport(tester);
    final store = MemorySaveStore();
    final context = runtimeAppContext(identity: snapQuestIdentity);
    await store.write(
      context,
      SaveEnvelope.create(
        context: context,
        schemaVersion: 1,
        savedAt: DateTime.utc(2026, 1, 1),
        payload: {
          'catalog_version': 3,
          'completed_quest_keys': ['daily-red:3'],
          'claimed_reward_ids': ['sticker-ember'],
          'album': [
            {
              'creature_id': 'azurling',
              'quest_key': 'daily-red:3',
              'descriptor_id': 'red',
            },
          ],
        },
      ),
    );
    await tester.pumpWidget(SnapQuestApp(saveStore: store));
    await tester.pumpAndSettle();

    expect(
      find.text('We could not open that collection. Starting fresh.'),
      findsOneWidget,
    );
    expect(find.textContaining('Emberling'), findsOneWidget);
    expect(find.text('red'), findsOneWidget);
  });
}

Future<void> _scrollToNextQuest(WidgetTester tester) async {
  await tester.scrollUntilVisible(
    find.textContaining('Azurling', skipOffstage: false),
    320,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.pumpAndSettle();
}

void _setLargeViewport(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 1200);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

final class _FrameSource implements CameraFrameSource {
  @override
  Future<EphemeralCameraFrame> capture(CaptureRequest request) async {
    return EphemeralCameraFrame(
      width: 2,
      height: 2,
      rgbBytes: Uint8List.fromList([
        250,
        30,
        30,
        30,
        30,
        250,
        250,
        30,
        30,
        30,
        30,
        250,
      ]),
    );
  }

  @override
  Future<void> cancel() async {}

  @override
  Future<void> dispose() async {}

  @override
  Future<void> pause() async {}

  @override
  Future<void> resume() async {}
}

final class _MismatchedCapture implements CaptureCapability {
  @override
  Future<RecognitionObservation> capture(CaptureRequest request) async {
    return RecognitionObservation(
      status: CaptureStatus.accepted,
      mode: CaptureMode.camera,
      questId: request.questId,
      questVersion: request.questVersion,
      descriptorId: 'blue',
      quality: 1,
      observedAt: request.observedAt,
    );
  }

  @override
  void dispose() {}
}

final class _BlockingCapture implements CaptureCapability {
  final Completer<RecognitionObservation> _result =
      Completer<RecognitionObservation>();
  int calls = 0;

  @override
  Future<RecognitionObservation> capture(CaptureRequest request) {
    calls++;
    return _result.future;
  }

  void complete(RecognitionObservation observation) {
    _result.complete(observation);
  }

  @override
  void dispose() {}
}
