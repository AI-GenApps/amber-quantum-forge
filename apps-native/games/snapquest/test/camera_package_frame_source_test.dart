import 'dart:async';
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:snapquest_rules/snapquest_rules.dart';
import 'package:snapquest/capabilities/camera_capture_models.dart';
import 'package:snapquest/capabilities/camera_package_frame_source.dart';

void main() {
  test('cancelling during camera discovery resolves the capture', () async {
    final cameras = Completer<List<CameraDescription>>();
    final source = CameraPackageFrameSource(
      cameraAvailability: () => cameras.future,
    );
    final capture = source.capture(request);
    await Future<void>.delayed(Duration.zero);
    final expectation = expectLater(
      capture,
      throwsA(isA<CameraCaptureCancelledException>()),
    );
    await source.cancel();
    await expectation;
  });

  test('cancelling during initialization disposes the controller', () async {
    final initialized = Completer<void>();
    late final FakeCameraController controller;
    final source = CameraPackageFrameSource(
      cameraAvailability: () async => [description],
      controllerFactory: (camera) {
        controller = FakeCameraController(camera, initialized);
        return controller;
      },
    );
    final capture = source.capture(request);
    await Future<void>.delayed(Duration.zero);
    final expectation = expectLater(
      capture,
      throwsA(isA<CameraCaptureCancelledException>()),
    );
    await source.cancel();
    await expectation;
    initialized.complete();
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);
    expect(controller.disposed, isTrue);
    expect(controller.disposeCalls, greaterThanOrEqualTo(2));
  });

  test(
    'late initialization completion retries cleanup after timeout',
    () async {
      final initialized = Completer<void>();
      late final FakeCameraController controller;
      final source = CameraPackageFrameSource(
        captureTimeout: const Duration(milliseconds: 20),
        cameraAvailability: () async => [description],
        controllerFactory: (camera) {
          controller = FakeCameraController(camera, initialized);
          return controller;
        },
      );
      final capture = source.capture(request);
      await expectLater(capture, throwsA(isA<CameraUnavailableException>()));
      expect(controller.disposeCalls, greaterThanOrEqualTo(1));
      initialized.complete();
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);
      expect(controller.disposeCalls, greaterThanOrEqualTo(2));
      expect(controller.disposed, isTrue);
    },
  );

  test('disposing during initialization releases the controller', () async {
    final initialized = Completer<void>();
    late final FakeCameraController controller;
    final source = CameraPackageFrameSource(
      cameraAvailability: () async => [description],
      controllerFactory: (camera) {
        controller = FakeCameraController(camera, initialized);
        return controller;
      },
    );
    final capture = source.capture(request);
    await Future<void>.delayed(Duration.zero);
    await source.dispose();
    initialized.complete();
    await expectLater(capture, throwsA(isA<CameraCaptureCancelledException>()));
    expect(controller.disposed, isTrue);
  });

  test('cancelling during stream startup disposes the controller', () async {
    final started = Completer<void>();
    late final FakeCameraController controller;
    final source = CameraPackageFrameSource(
      cameraAvailability: () async => [description],
      controllerFactory: (camera) {
        controller = FakeCameraController(
          camera,
          Completer<void>()..complete(),
          startCompleter: started,
        );
        return controller;
      },
    );
    final capture = source.capture(request);
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);
    expect(controller.startCalled, isTrue);
    final expectation = expectLater(
      capture,
      throwsA(isA<CameraCaptureCancelledException>()),
    );
    await source.cancel();
    await expectation;
    started.complete();
    await Future<void>.delayed(Duration.zero);
    await Future<void>.delayed(Duration.zero);
    expect(controller.disposed, isTrue);
    expect(controller.stopCalls, greaterThanOrEqualTo(1));
    expect(controller.disposeCalls, greaterThanOrEqualTo(2));
  });

  test(
    'late stream startup completion stops and disposes after timeout',
    () async {
      final started = Completer<void>();
      late final FakeCameraController controller;
      final source = CameraPackageFrameSource(
        captureTimeout: const Duration(milliseconds: 20),
        cameraAvailability: () async => [description],
        controllerFactory: (camera) {
          controller = FakeCameraController(
            camera,
            Completer<void>()..complete(),
            startCompleter: started,
          );
          return controller;
        },
      );
      final capture = source.capture(request);
      await expectLater(capture, throwsA(isA<CameraUnavailableException>()));
      expect(controller.disposeCalls, greaterThanOrEqualTo(1));
      started.complete();
      await Future<void>.delayed(Duration.zero);
      await Future<void>.delayed(Duration.zero);
      expect(controller.stopCalls, greaterThanOrEqualTo(1));
      expect(controller.disposeCalls, greaterThanOrEqualTo(2));
      expect(controller.disposed, isTrue);
    },
  );

  test('rejects RGB payloads with a mismatched frame size', () {
    expect(
      () => EphemeralCameraFrame(width: 2, height: 2, rgbBytes: Uint8List(11)),
      throwsArgumentError,
    );
  });
}

final description = CameraDescription(
  name: 'rear',
  lensDirection: CameraLensDirection.back,
  sensorOrientation: 90,
);

final request = CaptureRequest(
  questId: 'daily-red',
  questVersion: 3,
  descriptorIds: const {'red'},
  minimumQuality: 0.7,
  observedAt: DateTime.utc(2026, 1, 1),
);

class FakeCameraController extends CameraController {
  FakeCameraController(
    this.description,
    this.initialized, {
    this.startCompleter,
  }) : super(description, ResolutionPreset.low, enableAudio: false);

  @override
  final CameraDescription description;
  final Completer<void> initialized;
  final Completer<void>? startCompleter;
  bool disposed = false;
  bool startCalled = false;
  int disposeCalls = 0;
  int stopCalls = 0;

  @override
  Future<void> initialize() => initialized.future;

  @override
  Future<void> startImageStream(onLatestImageAvailable onAvailable) {
    startCalled = true;
    return startCompleter?.future ?? Future<void>.value();
  }

  @override
  Future<void> stopImageStream() async {
    stopCalls++;
  }

  @override
  Future<void> dispose() async {
    disposeCalls++;
    disposed = true;
    await super.dispose();
  }
}
