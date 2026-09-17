abstract interface class CourtClock {
  DateTime get now;
}

class MutableCourtClock implements CourtClock {
  MutableCourtClock(DateTime initial) : _value = _utc(initial);

  DateTime _value;

  @override
  DateTime get now => _value;

  void set(DateTime value) {
    _value = _utc(value);
  }

  void advance(Duration duration) {
    _value = _value.add(duration);
  }
}

DateTime _utc(DateTime value) => value.toUtc();
