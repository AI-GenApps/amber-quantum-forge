enum CaptureMode { desk, camera }

enum CaptureStatus {
  accepted,
  denied,
  unavailable,
  cancelled,
  lowQuality,
  failed,
}

class CaptureRequest {
  const CaptureRequest({
    required this.questId,
    required this.questVersion,
    required this.descriptorIds,
    required this.minimumQuality,
    required this.observedAt,
  });

  final String questId;
  final int questVersion;
  final Set<String> descriptorIds;
  final double minimumQuality;
  final DateTime observedAt;
}

class RecognitionObservation {
  const RecognitionObservation({
    required this.status,
    required this.mode,
    required this.questId,
    required this.questVersion,
    required this.descriptorId,
    required this.quality,
    required this.observedAt,
  });

  final CaptureStatus status;
  final CaptureMode mode;
  final String questId;
  final int questVersion;
  final String? descriptorId;
  final double quality;
  final DateTime observedAt;

  bool get accepted => status == CaptureStatus.accepted;
}

abstract interface class CaptureCapability {
  Future<RecognitionObservation> capture(CaptureRequest request);

  void dispose();
}
