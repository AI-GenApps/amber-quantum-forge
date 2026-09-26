import 'package:merge_rules/merge_rules.dart';

const mergeRelayTutorialVersion = 1;

enum MergeRelayRoute { home, tutorial, play, result, relay }

enum MergeRelayOutcome { completed, missed, terminal, earlyFinish }

extension MergeRelayOutcomePresentation on MergeRelayOutcome {
  String get title => switch (this) {
    MergeRelayOutcome.completed => 'Path cleared',
    MergeRelayOutcome.missed => 'Close call',
    MergeRelayOutcome.terminal => 'No more moves',
    MergeRelayOutcome.earlyFinish => 'Run paused',
  };

  String get actionLabel => switch (this) {
    MergeRelayOutcome.completed => 'Next path',
    MergeRelayOutcome.missed => 'Try again',
    MergeRelayOutcome.terminal => 'New run',
    MergeRelayOutcome.earlyFinish => 'Continue',
  };
}

extension MergeRelayModePresentation on MergeRelayMode {
  String get label => switch (this) {
    MergeRelayMode.rescue => 'Rescue',
    MergeRelayMode.daily => 'Daily',
    MergeRelayMode.endless => 'Endless',
  };

  String get goal => switch (this) {
    MergeRelayMode.rescue => 'Fuse the marked pair.',
    MergeRelayMode.daily => 'Find the best chain in three moves.',
    MergeRelayMode.endless => 'Keep the relay alive for one more merge.',
  };

  bool get usesMoveBudget => this != MergeRelayMode.endless;

  static MergeRelayMode fromName(String? value) {
    return MergeRelayMode.values.firstWhere(
      (mode) => mode.name == value,
      orElse: () => MergeRelayMode.endless,
    );
  }
}

final class MergeRelayPreferences {
  const MergeRelayPreferences({
    this.themeId = 'signal',
    this.reducedMotion = false,
    this.audioEnabled = true,
    this.musicEnabled = true,
    this.hapticsEnabled = true,
    this.accessibleControls = false,
    this.highContrast = false,
  });

  final String themeId;
  final bool reducedMotion;

  /// Gates sound effects (the "Sound" toggle in Settings) — see
  /// `MergeRelayAudioService.play`/`playMerge` in
  /// `audio/merge_relay_audio_service.dart`.
  final bool audioEnabled;

  /// Gates the looping background track (the "Music" toggle in Settings),
  /// independent of [audioEnabled] — see
  /// `MergeRelayAudioService.startMusicLoop`.
  final bool musicEnabled;
  final bool hapticsEnabled;
  final bool accessibleControls;
  final bool highContrast;

  MergeRelayPreferences copyWith({
    String? themeId,
    bool? reducedMotion,
    bool? audioEnabled,
    bool? musicEnabled,
    bool? hapticsEnabled,
    bool? accessibleControls,
    bool? highContrast,
  }) {
    return MergeRelayPreferences(
      themeId: themeId ?? this.themeId,
      reducedMotion: reducedMotion ?? this.reducedMotion,
      audioEnabled: audioEnabled ?? this.audioEnabled,
      musicEnabled: musicEnabled ?? this.musicEnabled,
      hapticsEnabled: hapticsEnabled ?? this.hapticsEnabled,
      accessibleControls: accessibleControls ?? this.accessibleControls,
      highContrast: highContrast ?? this.highContrast,
    );
  }
}

final class MergeRelayResult {
  const MergeRelayResult({
    required this.mode,
    required this.outcome,
    required this.score,
    required this.maxTile,
    required this.movesUsed,
    required this.objective,
    this.rescueId,
  });

  final MergeRelayMode mode;
  final MergeRelayOutcome outcome;
  final int score;
  final int maxTile;
  final int movesUsed;
  final String objective;
  final String? rescueId;

  String get message => switch (outcome) {
    MergeRelayOutcome.completed => 'Path cleared.',
    MergeRelayOutcome.missed => 'The pair stayed apart this time.',
    MergeRelayOutcome.terminal => 'Every lane is full. The chain ends here.',
    MergeRelayOutcome.earlyFinish => 'Your board is safe where you left it.',
  };

  Map<String, Object?> toJson() => {
    'mode': mode.name,
    'outcome': outcome.name,
    'score': score,
    'max_tile': maxTile,
    'moves_used': movesUsed,
    'objective': objective,
    if (rescueId != null) 'rescue_id': rescueId,
  };

  factory MergeRelayResult.fromJson(Map<String, Object?> json) {
    final mode = json['mode'];
    final outcome = json['outcome'];
    final score = json['score'];
    final maxTile = json['max_tile'];
    final movesUsed = json['moves_used'];
    final objective = json['objective'];
    final rescueId = json['rescue_id'];
    if (mode is! String ||
        outcome is! String ||
        score is! int ||
        maxTile is! int ||
        movesUsed is! int ||
        objective is! String ||
        (rescueId != null && rescueId is! String)) {
      throw const FormatException('Invalid Merge result');
    }
    final parsedMode = MergeRelayMode.values.where(
      (value) => value.name == mode,
    );
    if (parsedMode.isEmpty) {
      throw const FormatException('Invalid Merge mode');
    }
    return MergeRelayResult(
      mode: parsedMode.first,
      outcome: MergeRelayOutcome.values.firstWhere(
        (value) => value.name == outcome,
        orElse: () => throw const FormatException('Invalid Merge outcome'),
      ),
      score: score,
      maxTile: maxTile,
      movesUsed: movesUsed,
      objective: objective,
      rescueId: rescueId as String?,
    );
  }
}

final class MergeMovePresentation {
  const MergeMovePresentation({
    required this.before,
    required this.after,
    required this.direction,
    required this.scoreDelta,
    required this.changedCells,
    required this.mergedCells,
    required this.spawnedCell,
    required this.spawnedValue,
    this.isNewBestTile = false,
    this.bestTileCell,
  });

  factory MergeMovePresentation.fromResult({
    required MergeGameState before,
    required MergeMoveResult result,
    required MergeDirection direction,
    bool isNewBestTile = false,
  }) {
    final changedCells = <int>{};
    final mergedCells = {
      for (final pair in result.trace.mergedPairs) pair.destinationCell,
    };
    for (var index = 0; index < before.board.cells.length; index += 1) {
      if (before.board.cells[index] != result.state.board.cells[index]) {
        changedCells.add(index);
      }
    }
    int? bestTileCell;
    if (isNewBestTile && mergedCells.isNotEmpty) {
      final maxValue = result.state.board.cells.fold<int>(
        0,
        (highest, value) => value > highest ? value : highest,
      );
      bestTileCell = mergedCells.firstWhere(
        (cell) => result.state.board.cells[cell] == maxValue,
        orElse: () => mergedCells.first,
      );
    }
    return MergeMovePresentation(
      before: before.board,
      after: result.state.board,
      direction: direction,
      scoreDelta: result.scoreDelta,
      changedCells: Set.unmodifiable(changedCells),
      mergedCells: Set.unmodifiable(mergedCells),
      spawnedCell: result.spawnedCell,
      spawnedValue: result.spawnedValue,
      isNewBestTile: isNewBestTile,
      bestTileCell: bestTileCell,
    );
  }

  final MergeBoard before;
  final MergeBoard after;
  final MergeDirection direction;
  final int scoreDelta;
  final Set<int> changedCells;
  final Set<int> mergedCells;
  final int? spawnedCell;
  final int? spawnedValue;

  /// True when this move raised the board's highest tile value above any
  /// value reached so far this run — the trigger for the best-tile
  /// celebration and its heavy haptic.
  final bool isNewBestTile;

  /// The merged destination cell the celebration confetti radiates from,
  /// when [isNewBestTile] is true and the new max came from a merge.
  final int? bestTileCell;

  bool get hasMerge => scoreDelta > 0 && mergedCells.isNotEmpty;
}
