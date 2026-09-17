abstract interface class Clock {
  DateTime now();
}

final class SystemClock implements Clock {
  const SystemClock();

  @override
  DateTime now() => DateTime.now().toUtc();
}

final class FixedClock implements Clock {
  const FixedClock(this.value);

  final DateTime value;

  @override
  DateTime now() => value.toUtc();
}

int epochMilliseconds(DateTime value) => value.toUtc().millisecondsSinceEpoch;

DateTime dateTimeFromEpochMilliseconds(Object? value) {
  if (value is! int) throw const FormatException('Expected epoch milliseconds');
  return DateTime.fromMillisecondsSinceEpoch(value, isUtc: true);
}
