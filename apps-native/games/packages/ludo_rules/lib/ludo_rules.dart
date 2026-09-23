/// Pure Dart Ludo board, movement, turn and dice rules engine.
///
/// No Flutter/Flame/device imports — see
/// `tasks/epics/15-ludo-launch/01-rules-core.md` for the full spec. Bot
/// strategies (`ludo_bot.dart`) and cross-runtime replay fixtures were
/// added by task 02.
library;

export 'src/ludo_board.dart';
export 'src/ludo_bot.dart';
export 'src/ludo_config.dart';
export 'src/ludo_engine.dart';
export 'src/ludo_models.dart';
export 'src/ludo_replay.dart';
