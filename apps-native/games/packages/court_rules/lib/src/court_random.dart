abstract interface class CourtRandom {
  CourtRandom fork();

  int nextInt(int upperBound);
}

class SeededCourtRandom implements CourtRandom {
  SeededCourtRandom(int seed) : _state = _normalize(seed);

  SeededCourtRandom._(this._state);

  int _state;

  @override
  CourtRandom fork() => SeededCourtRandom._(_state);

  @override
  int nextInt(int upperBound) {
    if (upperBound <= 0) {
      throw ArgumentError.value(upperBound, 'upperBound');
    }
    _state ^= (_state << 13) & 0x7fffffff;
    _state ^= (_state >> 17);
    _state ^= (_state << 5) & 0x7fffffff;
    _state &= 0x7fffffff;
    return _state % upperBound;
  }
}

int _normalize(int value) {
  final normalized = value & 0x7fffffff;
  return normalized == 0 ? 1 : normalized;
}
