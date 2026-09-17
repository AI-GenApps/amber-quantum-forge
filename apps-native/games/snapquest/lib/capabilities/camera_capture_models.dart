import 'dart:math' as math;
import 'dart:typed_data';

import 'package:snapquest_rules/snapquest_rules.dart';

const maxCameraFrameBytes = 96 * 96 * 3;

enum CameraQualityBucket { unknown, low, usable, high }

enum CameraLifecycleState { foreground, background }

enum CameraFrameColorModel { fullRgb, luminanceOnly }

abstract interface class LifecycleAwareCaptureCapability {
  Future<void> onLifecycleChanged(CameraLifecycleState state);
}

class CameraAccessDeniedException implements Exception {}

class CameraUnavailableException implements Exception {}

class CameraCaptureCancelledException implements Exception {}

class EphemeralCameraFrame {
  EphemeralCameraFrame({
    required this.width,
    required this.height,
    required Uint8List rgbBytes,
    this.colorModel = CameraFrameColorModel.fullRgb,
  }) : _rgbBytes = rgbBytes {
    if (width < 1 ||
        height < 1 ||
        width > 96 ||
        height > 96 ||
        width * height * 3 > maxCameraFrameBytes ||
        rgbBytes.isEmpty ||
        rgbBytes.length != width * height * 3) {
      throw ArgumentError('invalid_camera_frame');
    }
  }

  final int width;
  final int height;
  final CameraFrameColorModel colorModel;
  Uint8List _rgbBytes;
  bool _disposed = false;

  bool get disposed => _disposed;

  Uint8List get rgbBytes => _disposed ? Uint8List(0) : _rgbBytes;

  void dispose() {
    if (_disposed) {
      return;
    }
    _rgbBytes.fillRange(0, _rgbBytes.length, 0);
    _rgbBytes = Uint8List(0);
    _disposed = true;
  }
}

class CameraAssessment {
  const CameraAssessment({
    required this.descriptorId,
    required this.qualityBucket,
  });

  final String? descriptorId;
  final CameraQualityBucket qualityBucket;
}

class CameraCaptureMetadata {
  const CameraCaptureMetadata({
    required this.status,
    required this.descriptorId,
    required this.qualityBucket,
    required this.elapsedMilliseconds,
    required this.frameCaptured,
    required this.colorModel,
  });

  final CaptureStatus status;
  final String? descriptorId;
  final CameraQualityBucket qualityBucket;
  final int elapsedMilliseconds;
  final bool frameCaptured;
  final CameraFrameColorModel colorModel;
}

abstract interface class CameraFrameProcessor {
  CameraAssessment process(EphemeralCameraFrame frame, CaptureRequest request);
}

class ColorQualityProcessor implements CameraFrameProcessor {
  const ColorQualityProcessor();

  @override
  CameraAssessment process(EphemeralCameraFrame frame, CaptureRequest request) {
    final bytes = frame.rgbBytes;
    if (bytes.length < 3) {
      return const CameraAssessment(
        descriptorId: null,
        qualityBucket: CameraQualityBucket.unknown,
      );
    }
    var sum = 0.0;
    var sumSquared = 0.0;
    var samples = 0;
    for (var index = 0; index + 2 < bytes.length; index += 3) {
      final luma =
          (0.2126 * bytes[index]) +
          (0.7152 * bytes[index + 1]) +
          (0.0722 * bytes[index + 2]);
      sum += luma;
      sumSquared += luma * luma;
      samples++;
    }
    if (samples == 0) {
      return const CameraAssessment(
        descriptorId: null,
        qualityBucket: CameraQualityBucket.unknown,
      );
    }
    final mean = sum / samples;
    final variance = math.max(0, (sumSquared / samples) - (mean * mean));
    final contrast = math.sqrt(variance) / 128;
    final score = ((mean / 255) * 0.4 + contrast.clamp(0, 1) * 0.6)
        .clamp(0, 1)
        .toDouble();
    final bucket = score >= 0.7
        ? CameraQualityBucket.high
        : score >= 0.45
        ? CameraQualityBucket.usable
        : score >= 0.2
        ? CameraQualityBucket.low
        : CameraQualityBucket.unknown;
    return CameraAssessment(descriptorId: null, qualityBucket: bucket);
  }
}
