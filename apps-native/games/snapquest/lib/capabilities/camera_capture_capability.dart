import 'dart:async';

import 'package:snapquest_rules/snapquest_rules.dart';

import 'camera_capture_models.dart';

abstract interface class CameraFrameSource {
  Future<EphemeralCameraFrame> capture(CaptureRequest request);

  Future<void> pause();

  Future<void> resume();

  Future<void> cancel();

  Future<void> dispose();
}

class CameraCaptureCapability
    implements CaptureCapability, LifecycleAwareCaptureCapability {
  CameraCaptureCapability({
    required this.source,
    this.processor = const ColorQualityProcessor(),
  });

  final CameraFrameSource source;
  final CameraFrameProcessor processor;
  bool _disposed = false;
  bool _background = false;
  bool _active = false;
  bool _cancelRequested = false;
  Future<void> _lifecycleQueue = Future<void>.value();

  CameraCaptureMetadata? lastCapture;

  @override
  Future<RecognitionObservation> capture(CaptureRequest request) async {
    if (_disposed) {
      return _observation(
        request,
        CaptureStatus.failed,
        null,
        CameraQualityBucket.unknown,
        0,
      );
    }
    await _lifecycleQueue;
    if (_disposed) {
      return _observation(
        request,
        CaptureStatus.failed,
        null,
        CameraQualityBucket.unknown,
        0,
      );
    }
    if (_background || _active) {
      return _observation(
        request,
        CaptureStatus.unavailable,
        null,
        CameraQualityBucket.unknown,
        0,
      );
    }
    _active = true;
    _cancelRequested = false;
    final stopwatch = Stopwatch()..start();
    EphemeralCameraFrame? frame;
    try {
      frame = await source.capture(request);
      if (_disposed || _cancelRequested || _background) {
        return _observation(
          request,
          CaptureStatus.cancelled,
          null,
          CameraQualityBucket.unknown,
          stopwatch.elapsedMilliseconds,
        );
      }
      final assessment = processor.process(frame, request);
      final allowedDescriptor =
          frame.colorModel == CameraFrameColorModel.fullRgb &&
          assessment.descriptorId != null &&
          request.descriptorIds.contains(assessment.descriptorId);
      final quality = _qualityValue(assessment.qualityBucket);
      final status = !allowedDescriptor
          ? CaptureStatus.lowQuality
          : quality < request.minimumQuality
          ? CaptureStatus.lowQuality
          : CaptureStatus.accepted;
      return _observation(
        request,
        status,
        allowedDescriptor ? assessment.descriptorId : null,
        assessment.qualityBucket,
        stopwatch.elapsedMilliseconds,
        quality: quality,
        frameCaptured: true,
        colorModel: frame.colorModel,
      );
    } on CameraAccessDeniedException {
      return _observation(
        request,
        CaptureStatus.denied,
        null,
        CameraQualityBucket.unknown,
        stopwatch.elapsedMilliseconds,
      );
    } on CameraCaptureCancelledException {
      return _observation(
        request,
        CaptureStatus.cancelled,
        null,
        CameraQualityBucket.unknown,
        stopwatch.elapsedMilliseconds,
      );
    } on CameraUnavailableException {
      return _observation(
        request,
        CaptureStatus.unavailable,
        null,
        CameraQualityBucket.unknown,
        stopwatch.elapsedMilliseconds,
      );
    } catch (_) {
      return _observation(
        request,
        CaptureStatus.failed,
        null,
        CameraQualityBucket.unknown,
        stopwatch.elapsedMilliseconds,
      );
    } finally {
      frame?.dispose();
      _active = false;
      _cancelRequested = false;
      stopwatch.stop();
    }
  }

  Future<void> cancelCapture() async {
    if (!_active || _disposed) {
      return;
    }
    _cancelRequested = true;
    await source.cancel();
  }

  @override
  Future<void> onLifecycleChanged(CameraLifecycleState state) async {
    _background = state == CameraLifecycleState.background;
    if (_background) _cancelRequested = true;
    final transition = _lifecycleQueue.then((_) => _applyLifecycle(state));
    _lifecycleQueue = transition.catchError((_) {});
    await transition;
  }

  Future<void> _applyLifecycle(CameraLifecycleState state) async {
    if (_disposed) return;
    if (state == CameraLifecycleState.background) {
      await cancelCapture();
      await source.pause();
    } else {
      await source.resume();
    }
  }

  Future<void> disposeAsync() async {
    if (_disposed) {
      return;
    }
    _disposed = true;
    _cancelRequested = true;
    if (_active) {
      await source.cancel();
    }
    await source.dispose();
  }

  @override
  void dispose() {
    unawaited(disposeAsync());
  }

  RecognitionObservation _observation(
    CaptureRequest request,
    CaptureStatus status,
    String? descriptorId,
    CameraQualityBucket bucket,
    int elapsedMilliseconds, {
    double quality = 0,
    bool frameCaptured = false,
    CameraFrameColorModel colorModel = CameraFrameColorModel.fullRgb,
  }) {
    lastCapture = CameraCaptureMetadata(
      status: status,
      descriptorId: descriptorId,
      qualityBucket: bucket,
      elapsedMilliseconds: elapsedMilliseconds,
      frameCaptured: frameCaptured,
      colorModel: colorModel,
    );
    return RecognitionObservation(
      status: status,
      mode: CaptureMode.camera,
      questId: request.questId,
      questVersion: request.questVersion,
      descriptorId: descriptorId,
      quality: quality,
      observedAt: request.observedAt.toUtc(),
    );
  }

  double _qualityValue(CameraQualityBucket bucket) {
    return switch (bucket) {
      CameraQualityBucket.unknown => 0,
      CameraQualityBucket.low => 0.25,
      CameraQualityBucket.usable => 0.65,
      CameraQualityBucket.high => 0.9,
    };
  }
}
