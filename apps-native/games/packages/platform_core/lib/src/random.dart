final class DeterministicRng {
  static const algorithm = 'xorshift32-v1';

  DeterministicRng(int seed) : _state = _normalize(seed);

  DeterministicRng.fromState(int state) : _state = _normalize(state);

  static const _mask = 0xffffffff;
  static const _fallbackState = 0x6d2b79f5;

  int _state;

  int get state => _state;
  int get state32 => _state & _mask;

  static int _normalize(int value) {
    final normalized = value & _mask;
    return normalized == 0 ? _fallbackState : normalized;
  }

  int nextUint32() {
    var value = _state;
    value ^= (value << 13) & _mask;
    value ^= value >> 17;
    value ^= (value << 5) & _mask;
    _state = _normalize(value);
    return _state;
  }

  int nextInt(int maximumExclusive) {
    if (maximumExclusive <= 0) {
      throw ArgumentError.value(maximumExclusive, 'maximumExclusive');
    }
    return nextUint32() % maximumExclusive;
  }

  bool oneIn(int denominator) {
    if (denominator <= 0) {
      throw ArgumentError.value(denominator, 'denominator');
    }
    return nextInt(denominator) == 0;
  }

  Map<String, Object> snapshot() => {'algorithm': algorithm, 'state': state32};
}
