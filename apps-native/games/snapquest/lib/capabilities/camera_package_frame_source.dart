import 'dart:async';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:camera/camera.dart';
import 'package:snapquest_rules/snapquest_rules.dart';

import 'camera_capture_capability.dart';
import 'camera_capture_models.dart';

part 'camera_package_frame_source_helpers.dart';

typedef CameraAvailability = Future<List<CameraDescription>> Function();
typedef CameraControllerFactory = CameraController Function(
  CameraDescription description,
);

class CameraPackageFrameSource implements CameraFrameSource {
  CameraPackageFrameSource({
    CameraAvailability? cameraAvailability,
    CameraControllerFactory? controllerFactory,
    Duration? captureTimeout,
    Duration? cleanupTimeout,
  }) : cameraAvailability = cameraAvailability ?? availableCameras,
       controllerFactory = controllerFactory ?? _createController,
       _captureTimeout = captureTimeout ?? const Duration(seconds: 5),
       _cleanupTimeout = cleanupTimeout ?? const Duration(seconds: 1);

  final CameraAvailability cameraAvailability;
  final CameraControllerFactory controllerFactory;
  final Duration _captureTimeout;
  final Duration _cleanupTimeout;
  CameraController? _controller;
  Completer<EphemeralCameraFrame>? _frameCompleter;
  Completer<void>? _cancelSignal;
  bool _streaming = false;
  bool _cancelRequested = false;
  bool _paused = false;
  bool _disposed = false;
  bool _frameResultClosed = false;
  Object? _activeSession;

  @override
  Future<EphemeralCameraFrame> capture(CaptureRequest request) async {
    if (_disposed || _paused || _frameCompleter != null) {
      throw CameraUnavailableException();
    }
    _cancelRequested = false;
    _frameResultClosed = false;
    final session = Object();
    _activeSession = session;
    final cancelSignal = Completer<void>();
    _cancelSignal = cancelSignal;
    final completer = Completer<EphemeralCameraFrame>();
    var frameReturned = false;
    unawaited(
      completer.future.then<void>((frame) {
        if (!frameReturned && cancelSignal.isCompleted) frame.dispose();
      }, onError: (_, _) {}),
    );
    _frameCompleter = completer;
    CameraController? controller;
    var sessionStreaming = false;
    var cleanupRunning = false;
    var cleanupAgain = false;
    Future<void> cleanupSession() async {
      if (cleanupRunning) {
        cleanupAgain = true;
        return;
      }
      cleanupRunning = true;
      do {
        cleanupAgain = false;
        final activeController = controller;
        if (activeController == null) {
          break;
        }
        final stopped = await _stopControllerStream(
          activeController,
          expectedStreaming: sessionStreaming,
        );
        if (stopped) sessionStreaming = false;
        await _disposeController(activeController);
      } while (cleanupAgain);
      cleanupRunning = false;
    }

    void monitorStage(Future<void> stage, {void Function()? onSuccess}) {
      unawaited(
        stage.then<void>(
          (_) {
            onSuccess?.call();
            if (!identical(_activeSession, session) ||
                cancelSignal.isCompleted) {
              unawaited(cleanupSession());
            }
          },
          onError: (_, _) {
            if (!identical(_activeSession, session) ||
                cancelSignal.isCompleted) {
              unawaited(cleanupSession());
            }
          },
        ),
      );
    }

    final stopwatch = Stopwatch()..start();
    try {
      final cameras = await _awaitStage(
        cameraAvailability(),
        cancelSignal,
        stopwatch,
      );
      _ensureActive();
      if (cameras.isEmpty) {
        throw CameraUnavailableException();
      }
      final description = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      controller = controllerFactory(description);
      _controller = controller;
      final initialize = controller.initialize();
      monitorStage(initialize);
      await _awaitStage(initialize, cancelSignal, stopwatch);
      _ensureActive();
      final startImageStream = controller.startImageStream((image) {
        if (!identical(_activeSession, session) ||
            _frameResultClosed ||
            completer.isCompleted) {
          return;
        }
        try {
          final frame = _toEphemeralFrame(image);
          if (cancelSignal.isCompleted || _cancelRequested) {
            frame.dispose();
            return;
          }
          completer.complete(frame);
        } on CameraUnavailableException catch (error, stackTrace) {
          completer.completeError(error, stackTrace);
        } catch (error, stackTrace) {
          completer.completeError(CameraUnavailableException(), stackTrace);
        }
      });
      monitorStage(startImageStream, onSuccess: () => sessionStreaming = true);
      await _awaitStage(startImageStream, cancelSignal, stopwatch);
      sessionStreaming = true;
      _streaming = true;
      _ensureActive();
      final frame = await _awaitStage(
        completer.future,
        cancelSignal,
        stopwatch,
      );
      _ensureActive();
      frameReturned = true;
      return frame;
    } on CameraException catch (error) {
      throw _mapCameraException(error);
    } on TimeoutException {
      throw CameraUnavailableException();
    } finally {
      _frameResultClosed = true;
      if (controller != null && identical(_controller, controller)) {
        await cleanupSession();
        _streaming = false;
        _controller = null;
      }
      if (identical(_frameCompleter, completer)) {
        _frameCompleter = null;
      }
      if (identical(_activeSession, session)) {
        _activeSession = null;
      }
      if (identical(_cancelSignal, cancelSignal)) {
        _cancelSignal = null;
      }
      stopwatch.stop();
      _cancelRequested = false;
    }
  }

  @override
  Future<void> pause() async {
    _paused = true;
    await cancel();
  }

  @override
  Future<void> resume() async {
    if (!_disposed) {
      _paused = false;
    }
  }

  @override
  Future<void> cancel() async {
    _cancelRequested = true;
    final cancelSignal = _cancelSignal;
    if (cancelSignal != null && !cancelSignal.isCompleted) {
      cancelSignal.complete();
    }
    _frameResultClosed = true;
    final controller = _controller;
    if (controller != null) {
      await _stopStream(controller);
    }
  }

  @override
  Future<void> dispose() async {
    if (_disposed) {
      return;
    }
    _disposed = true;
    await cancel();
    final controller = _controller;
    if (controller != null && identical(_controller, controller)) {
      _controller = null;
      await _disposeController(controller);
    }
  }

  void _ensureActive() {
    if (_disposed || _paused || _cancelRequested) {
      throw CameraCaptureCancelledException();
    }
  }

  Object _mapCameraException(CameraException error) {
    return switch (error.code) {
      'CameraAccessDenied' ||
      'CameraAccessDeniedWithoutPrompt' ||
      'CameraAccessRestricted' => CameraAccessDeniedException(),
      'AudioAccessDenied' ||
      'AudioAccessDeniedWithoutPrompt' => CameraUnavailableException(),
      _ => CameraUnavailableException(),
    };
  }

  static CameraController _createController(CameraDescription description) {
    return CameraController(
      description,
      ResolutionPreset.low,
      enableAudio: false,
    );
  }

  EphemeralCameraFrame _toEphemeralFrame(CameraImage image) {
    if (image.width < 1 || image.height < 1 || image.planes.isEmpty) {
      throw CameraUnavailableException();
    }
    final scale = math.min(1.0, math.min(96 / image.width, 96 / image.height));
    final width = math.max(1, (image.width * scale).floor());
    final height = math.max(1, (image.height * scale).floor());
    final bytes = Uint8List(width * height * 3);
    final luminanceOnly = image.format.group != ImageFormatGroup.bgra8888;
    try {
      var offset = 0;
      for (var y = 0; y < height; y++) {
        final sourceY = (y * image.height / height).floor();
        for (var x = 0; x < width; x++) {
          final sourceX = (x * image.width / width).floor();
          final pixel = _pixel(image, sourceX, sourceY);
          bytes[offset++] = pixel.$1;
          bytes[offset++] = pixel.$2;
          bytes[offset++] = pixel.$3;
        }
      }
      return EphemeralCameraFrame(
        width: width,
        height: height,
        rgbBytes: bytes,
        colorModel: luminanceOnly
            ? CameraFrameColorModel.luminanceOnly
            : CameraFrameColorModel.fullRgb,
      );
    } catch (_) {
      bytes.fillRange(0, bytes.length, 0);
      rethrow;
    }
  }
}
