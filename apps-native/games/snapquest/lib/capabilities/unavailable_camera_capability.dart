import 'package:snapquest_rules/snapquest_rules.dart';

class UnavailableCameraCapability implements CaptureCapability {
  bool _disposed = false;

  @override
  Future<RecognitionObservation> capture(CaptureRequest request) async {
    if (_disposed) {
      return RecognitionObservation(
        status: CaptureStatus.failed,
        mode: CaptureMode.camera,
        questId: request.questId,
        questVersion: request.questVersion,
        descriptorId: null,
        quality: 0,
        observedAt: request.observedAt,
      );
    }
    return RecognitionObservation(
      status: CaptureStatus.unavailable,
      mode: CaptureMode.camera,
      questId: request.questId,
      questVersion: request.questVersion,
      descriptorId: null,
      quality: 0,
      observedAt: request.observedAt,
    );
  }

  @override
  void dispose() {
    _disposed = true;
  }
}
