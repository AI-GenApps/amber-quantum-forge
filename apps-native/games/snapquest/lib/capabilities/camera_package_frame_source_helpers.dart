part of 'camera_package_frame_source.dart';

extension on CameraPackageFrameSource {
  Future<void> _stopStream(CameraController controller) async {
    final expectedStreaming = _streaming;
    _streaming = false;
    await _stopControllerStream(
      controller,
      expectedStreaming: expectedStreaming,
    );
  }

  Future<bool> _stopControllerStream(
    CameraController controller, {
    required bool expectedStreaming,
  }) async {
    var wasStreaming = expectedStreaming;
    try {
      wasStreaming = wasStreaming || controller.value.isStreamingImages;
    } on Object {
      return false;
    }
    if (!wasStreaming) {
      return true;
    }
    try {
      if (!expectedStreaming && !controller.value.isStreamingImages) {
        return true;
      }
    } on Object {
      return false;
    }
    try {
      await controller.stopImageStream().timeout(_cleanupTimeout);
      return true;
    } on Object {
      return false;
    }
  }

  Future<void> _disposeController(CameraController controller) async {
    try {
      await controller.dispose().timeout(_cleanupTimeout);
    } on Object {
      return;
    }
  }

  Future<T> _awaitStage<T>(
    Future<T> operation,
    Completer<void> cancelSignal,
    Stopwatch stopwatch,
  ) async {
    final remaining = _captureTimeout - stopwatch.elapsed;
    if (remaining <= Duration.zero) {
      throw CameraUnavailableException();
    }
    try {
      return await Future.any<T>([
        operation.timeout(remaining),
        cancelSignal.future.then<T>(
          (_) => throw CameraCaptureCancelledException(),
        ),
      ]);
    } on TimeoutException {
      throw CameraUnavailableException();
    }
  }

  (int, int, int) _pixel(CameraImage image, int x, int y) {
    return switch (image.format.group) {
      ImageFormatGroup.bgra8888 => _bgraPixel(image.planes.first, x, y),
      ImageFormatGroup.yuv420 ||
      ImageFormatGroup.nv21 => _lumaPixel(image.planes.first, x, y),
      ImageFormatGroup.jpeg ||
      ImageFormatGroup.unknown => throw CameraUnavailableException(),
    };
  }

  (int, int, int) _bgraPixel(Plane plane, int x, int y) {
    final pixelStride = plane.bytesPerPixel ?? 4;
    final index = y * plane.bytesPerRow + x * pixelStride;
    if (index < 0 || index + 2 >= plane.bytes.length) {
      throw CameraUnavailableException();
    }
    return (plane.bytes[index + 2], plane.bytes[index + 1], plane.bytes[index]);
  }

  (int, int, int) _lumaPixel(Plane plane, int x, int y) {
    final index = y * plane.bytesPerRow + x;
    if (index < 0 || index >= plane.bytes.length) {
      throw CameraUnavailableException();
    }
    final value = plane.bytes[index];
    return (value, value, value);
  }
}
