import 'merge_relay_service_outcome.dart';
import 'network/merge_relay_models.dart';

enum MergeRelayDailyPhase { local, loading, ready, offline, error }

final class MergeRelayDailyStatus {
  const MergeRelayDailyStatus.local()
    : phase = MergeRelayDailyPhase.local,
      daily = null,
      outcome = null;

  const MergeRelayDailyStatus.loading()
    : phase = MergeRelayDailyPhase.loading,
      daily = null,
      outcome = null;

  const MergeRelayDailyStatus.ready(MergeRelayDailyChallenge this.daily)
    : phase = MergeRelayDailyPhase.ready,
      outcome = null;

  MergeRelayDailyStatus.failed(MergeRelayServiceOutcome this.outcome)
    : phase = outcome.kind == MergeRelayOutcomeKind.offline
          ? MergeRelayDailyPhase.offline
          : MergeRelayDailyPhase.error,
      daily = null;

  final MergeRelayDailyPhase phase;
  final MergeRelayDailyChallenge? daily;
  final MergeRelayServiceOutcome? outcome;

  bool get canRetry =>
      phase == MergeRelayDailyPhase.offline ||
      phase == MergeRelayDailyPhase.error;

  String get subtitle => switch (phase) {
    MergeRelayDailyPhase.local => "Today's board",
    MergeRelayDailyPhase.loading => "Checking today's board",
    MergeRelayDailyPhase.ready => "Today's service board",
    MergeRelayDailyPhase.offline => 'Offline. Local board ready',
    MergeRelayDailyPhase.error => 'Service down. Local board ready',
  };

  String? get detail => outcome?.message;
}
