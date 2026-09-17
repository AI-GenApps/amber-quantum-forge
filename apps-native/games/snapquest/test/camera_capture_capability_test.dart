import 'dart:async';
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:snapquest_rules/snapquest_rules.dart';
import 'package:snapquest/capabilities/camera_capture_capability.dart';
import 'package:snapquest/capabilities/camera_capture_models.dart';

void main() {
  test('denied permission does not expose a frame', () async {
    final source = FakeCameraSource()..error = CameraAccessDeniedException();
    final capability = CameraCaptureCapability(source: source);
    final observation = await capability.capture(request());
    expect(observation.status, CaptureStatus.denied);
    expect(capability.lastCapture?.qualityBucket, CameraQualityBucket.unknown);
    expect(capability.lastCapture?.frameCaptured, isFalse);
    expect(source.captureCount, 1);
    await capability.disposeAsync();
    expect(source.disposed, isTrue);
  });

  test(
    'accepted assessment is bounded to requested descriptors and clears frame',
    () async {
      final source = FakeCameraSource();
      final capability = CameraCaptureCapability(
        source: source,
        processor: const FixedProcessor(
          descriptorId: 'red',
          qualityBucket: CameraQualityBucket.high,
        ),
      );
      final observation = await capability.capture(request());
      expect(observation.status, CaptureStatus.accepted);
      expect(observation.descriptorId, 'red');
      expect(observation.quality, 0.9);
      expect(
        capability.lastCapture?.elapsedMilliseconds,
        greaterThanOrEqualTo(0),
      );
      expect(capability.lastCapture?.frameCaptured, isTrue);
      expect(capability.lastCapture?.colorModel, CameraFrameColorModel.fullRgb);
      final frame = source.capturedFrame!;
      expect(frame.disposed, isTrue);
      expect(frame.rgbBytes, isEmpty);
      await capability.disposeAsync();
    },
  );

  test(
    'unknown recognition remains unverified even with measurable color quality',
    () async {
      final source = FakeCameraSource();
      final capability = CameraCaptureCapability(source: source);
      final observation = await capability.capture(request());
      expect(observation.status, CaptureStatus.lowQuality);
      expect(observation.descriptorId, isNull);
      expect(
        capability.lastCapture?.qualityBucket,
        isNot(CameraQualityBucket.unknown),
      );
      expect(capability.lastCapture?.frameCaptured, isTrue);
      await capability.disposeAsync();
    },
  );

  test('background cancels an active capture and resumes the source', () async {
    final source = FakeCameraSource()
      ..pending = Completer<EphemeralCameraFrame>();
    final capability = CameraCaptureCapability(
      source: source,
      processor: const FixedProcessor(
        descriptorId: 'red',
        qualityBucket: CameraQualityBucket.high,
      ),
    );
    final capture = capability.capture(request());
    await Future<void>.delayed(Duration.zero);
    await capability.onLifecycleChanged(CameraLifecycleState.background);
    expect(source.cancelled, isTrue);
    expect(source.paused, isTrue);
    final frame = source.frameForCompletion;
    source.pending!.complete(frame);
    final observation = await capture;
    expect(observation.status, CaptureStatus.cancelled);
    expect(frame.disposed, isTrue);
    await capability.onLifecycleChanged(CameraLifecycleState.foreground);
    expect(source.resumed, isTrue);
    await capability.disposeAsync();
  });

  test('rapid lifecycle transitions keep native calls ordered', () async {
    final source = FakeCameraSource()..pauseGate = Completer<void>();
    final capability = CameraCaptureCapability(source: source);
    final background = capability.onLifecycleChanged(
      CameraLifecycleState.background,
    );
    final foreground = capability.onLifecycleChanged(
      CameraLifecycleState.foreground,
    );
    final capture = capability.capture(request());
    await Future<void>.delayed(Duration.zero);
    expect(source.lifecycleCalls, ['pause']);
    expect(source.captureCount, 0);
    source.pauseGate!.complete();
    await Future.wait([background, foreground]);
    expect((await capture).status, CaptureStatus.lowQuality);
    expect(source.lifecycleCalls, ['pause', 'resume']);
    expect(source.resumed, isTrue);
    await capability.disposeAsync();
  });

  test('cancel and dispose release the native session', () async {
    final source = FakeCameraSource()
      ..pending = Completer<EphemeralCameraFrame>();
    final capability = CameraCaptureCapability(source: source);
    final capture = capability.capture(request());
    await Future<void>.delayed(Duration.zero);
    await capability.cancelCapture();
    final frame = source.frameForCompletion;
    source.pending!.complete(frame);
    expect((await capture).status, CaptureStatus.cancelled);
    await capability.disposeAsync();
    expect(source.disposed, isTrue);
    expect((await capability.capture(request())).status, CaptureStatus.failed);
  });
}

CaptureRequest request() => CaptureRequest(
  questId: 'daily-red',
  questVersion: 3,
  descriptorIds: const {'red', 'blue'},
  minimumQuality: 0.7,
  observedAt: DateTime.utc(2026, 1, 1),
);

class FixedProcessor implements CameraFrameProcessor {
  const FixedProcessor({
    required this.descriptorId,
    required this.qualityBucket,
  });

  final String? descriptorId;
  final CameraQualityBucket qualityBucket;

  @override
  CameraAssessment process(
    EphemeralCameraFrame frame,
    CaptureRequest request,
  ) => CameraAssessment(
    descriptorId: descriptorId,
    qualityBucket: qualityBucket,
  );
}

class FakeCameraSource implements CameraFrameSource {
  int captureCount = 0;
  Object? error;
  Completer<EphemeralCameraFrame>? pending;
  bool cancelled = false;
  bool paused = false;
  bool resumed = false;
  bool disposed = false;
  EphemeralCameraFrame? capturedFrame;
  Completer<void>? pauseGate;
  final lifecycleCalls = <String>[];

  EphemeralCameraFrame get frameForCompletion => _frame();

  @override
  Future<EphemeralCameraFrame> capture(CaptureRequest request) async {
    captureCount++;
    if (error != null) {
      throw error!;
    }
    if (pending != null) {
      return pending!.future;
    }
    capturedFrame = _frame();
    return capturedFrame!;
  }

  @override
  Future<void> cancel() async {
    cancelled = true;
  }

  @override
  Future<void> dispose() async {
    disposed = true;
  }

  @override
  Future<void> pause() async {
    lifecycleCalls.add('pause');
    if (pauseGate != null) await pauseGate!.future;
    paused = true;
  }

  @override
  Future<void> resume() async {
    lifecycleCalls.add('resume');
    resumed = true;
  }

  EphemeralCameraFrame _frame() => EphemeralCameraFrame(
    width: 2,
    height: 2,
    rgbBytes: Uint8List.fromList([
      240,
      80,
      40,
      200,
      120,
      80,
      240,
      80,
      40,
      200,
      120,
      80,
    ]),
  );
}
