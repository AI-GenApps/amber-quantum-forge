/// Wire DTOs for the rewards routes (task 26h): the daily-reward calendar
/// read model (`GET .../daily-reward`) and the rewarded-ad status
/// (`GET .../ads/rewarded/status`). Kept apart from `ludo_gateway.dart` so
/// that file stays focused on request shaping.
library;

import 'ludo_wire_json.dart';

/// One calendar day's reward.
final class LudoDailyRewardDay {
  const LudoDailyRewardDay({
    required this.day,
    required this.coins,
    required this.diamonds,
  });

  final int day;
  final int coins;
  final int diamonds;

  static LudoDailyRewardDay fromWire(LudoJson value) {
    requireFields(value, {'day', 'coins', 'diamonds'}, 'daily reward day');
    return LudoDailyRewardDay(
      day: readInteger(value, 'day'),
      coins: readInteger(value, 'coins'),
      diamonds: readInteger(value, 'diamonds'),
    );
  }
}

/// `GET /games/ludo/:environment/daily-reward`: everything the calendar
/// screen renders. The client never derives streak or bonus values itself.
final class LudoDailyRewardStatus {
  const LudoDailyRewardStatus({
    required this.claimedToday,
    required this.streakDay,
    required this.nextDay,
    required this.calendar,
    required this.passActive,
    required this.passBonusPercent,
  });

  /// `true` once today's (UTC) reward has been claimed.
  final bool claimedToday;

  /// The last claimed calendar day while the streak is alive, else `0`.
  final int streakDay;

  /// The calendar day the next claim grants.
  final int nextDay;
  final List<LudoDailyRewardDay> calendar;

  /// Whether the Vortex Pass is active, so a claim carries its bonus.
  final bool passActive;
  final int passBonusPercent;

  static LudoDailyRewardStatus fromWire(LudoJson value) {
    requireFields(value, {
      'claimedToday',
      'streakDay',
      'nextDay',
      'calendar',
      'passActive',
      'passBonusPercent',
    }, 'daily reward status');
    return LudoDailyRewardStatus(
      claimedToday: readBoolean(value, 'claimedToday'),
      streakDay: readInteger(value, 'streakDay'),
      nextDay: readInteger(value, 'nextDay'),
      calendar: [
        for (final entry in asJsonList(value['calendar'], 'calendar'))
          LudoDailyRewardDay.fromWire(asJsonObject(entry, 'calendar day')),
      ],
      passActive: readBoolean(value, 'passActive'),
      passBonusPercent: readInteger(value, 'passBonusPercent'),
    );
  }
}

/// One rewarded-ad unit's daily allowance.
final class LudoAdUnitStatus {
  const LudoAdUnitStatus({
    required this.rewardAmount,
    required this.dailyCap,
    required this.claimedToday,
    required this.remaining,
  });

  final int rewardAmount;
  final int dailyCap;
  final int claimedToday;
  final int remaining;

  static LudoAdUnitStatus fromWire(Object? value, String name) {
    final json = asJsonObject(value, name);
    requireFields(json, {
      'rewardAmount',
      'dailyCap',
      'claimedToday',
      'remaining',
    }, name);
    return LudoAdUnitStatus(
      rewardAmount: readInteger(json, 'rewardAmount'),
      dailyCap: readInteger(json, 'dailyCap'),
      claimedToday: readInteger(json, 'claimedToday'),
      remaining: readInteger(json, 'remaining'),
    );
  }
}

/// `GET /games/ludo/:environment/ads/rewarded/status`.
final class LudoRewardedAdsStatus {
  const LudoRewardedAdsStatus({
    required this.ssvUserId,
    required this.coins,
    required this.diamonds,
  });

  /// The user id to put in the ad's server-side verification options, so
  /// AdMob's signed callback names this subject.
  final String ssvUserId;
  final LudoAdUnitStatus coins;
  final LudoAdUnitStatus diamonds;

  static LudoRewardedAdsStatus fromWire(LudoJson value) {
    requireFields(value, {
      'ssvUserId',
      'coins',
      'diamonds',
    }, 'rewarded ads status');
    return LudoRewardedAdsStatus(
      ssvUserId: readText(value, 'ssvUserId', 256),
      coins: LudoAdUnitStatus.fromWire(value['coins'], 'coin ads'),
      diamonds: LudoAdUnitStatus.fromWire(value['diamonds'], 'diamond ads'),
    );
  }
}
