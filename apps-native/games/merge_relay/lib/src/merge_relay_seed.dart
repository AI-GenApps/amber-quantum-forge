part of 'merge_relay_game.dart';

String _mergeRelayUtcDate(DateTime now) {
  final value = now.toUtc();
  return '${value.year.toString().padLeft(4, '0')}-'
      '${value.month.toString().padLeft(2, '0')}-'
      '${value.day.toString().padLeft(2, '0')}';
}

int _mergeRelayDailySeed(String date) {
  var seed = 17;
  for (final code in date.codeUnits) {
    seed = ((seed * 31) + code) & maxMergeSeed;
  }
  return seed == 0 ? 1 : seed;
}
