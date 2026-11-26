import 'package:flutter/material.dart';

import 'package:capartner/data/cap_reading.dart';
import 'package:capartner/theme/app_colors.dart';

/// How a reading, or the wearer overall, is doing.
enum VitalStatus {
  /// Nothing from the cap yet. First so any real reading outranks it.
  noData('No Data', AppColors.mutedText, Icons.sensors_off_rounded),
  stable('Stable', AppColors.green, Icons.check_circle_rounded),
  attention('Needs Attention', AppColors.amber, Icons.error_rounded),
  unstable('Unstable', AppColors.red, Icons.warning_rounded);

  const VitalStatus(this.label, this.color, this.icon);

  final String label;
  final Color color;
  final IconData icon;

  /// The more serious of the two.
  VitalStatus worst(VitalStatus other) => other.index > index ? other : this;
}

/// A band of readings and what it means.
class VitalRange {
  const VitalRange(this.label, this.description, this.status);

  final String label;
  final String description;
  final VitalStatus status;
}

/// What the cap's motion sensor last saw.
enum MotionState {
  stationary('Stationary', Icons.accessibility_new_rounded),
  moving('Moving', Icons.directions_walk_rounded),
  walking('Walking', Icons.directions_walk_rounded),
  running('Running', Icons.directions_run_rounded),
  fallDetected('Fall detected', Icons.personal_injury_rounded);

  const MotionState(this.label, this.icon);

  final String label;
  final IconData icon;
}

/// A stretch of the day spent active or still, for the motion timeline.
class MotionPeriod {
  const MotionPeriod({
    required this.active,
    required this.minutes,
    required this.label,
  });

  final bool active;
  final int minutes;

  /// What the wearer was doing, as shown in the activity log.
  final String label;
}

/// Readings from the paired cap.
///
/// A reading is null until the cap has sent one; [empty] is what the
/// dashboard shows until then. [sample] is fixed demo data. Readings above
/// the admin's [thresholds] are [VitalStatus.unstable].
class Vitals {
  const Vitals({
    required this.heartRate,
    required this.heartRateHistory,
    required this.bodyTemperature,
    required this.temperatureHistory,
    required this.motion,
    required this.stillMinutes,
    required this.motionToday,
    this.batteryPct,
    this.thresholds = VitalThresholds.defaults,
  });

  /// The dashboard's view of [readings], oldest first, as of [now].
  factory Vitals.fromReadings(
    List<CapReading> readings, {
    required VitalThresholds thresholds,
    required DateTime now,
  }) {
    List<CapReading> since(Duration age) => [
      for (final reading in readings)
        if (!reading.recordedAt.isBefore(now.subtract(age))) reading,
    ];
    List<double> lastValues(Iterable<num?> values, int count) {
      final list = [for (final value in values) ?value?.toDouble()];
      return list.length > count ? list.sublist(list.length - count) : list;
    }

    final withMotion = [
      for (final reading in readings)
        if (reading.motion != null) reading,
    ];

    // How long the latest motion state has lasted.
    var stillMinutes = 0;
    if (withMotion.isNotEmpty) {
      var start = withMotion.last;
      for (final reading in withMotion.reversed) {
        if (reading.motion != withMotion.last.motion) break;
        start = reading;
      }
      stillMinutes = now.difference(start.recordedAt).inMinutes;
    }

    // Today's stretches of moving and standing still.
    final local = now.toLocal();
    final midnight = DateTime(local.year, local.month, local.day).toUtc();
    final today = [
      for (final reading in withMotion)
        if (!reading.recordedAt.isBefore(midnight)) reading,
    ];
    final periods = <MotionPeriod>[];
    for (var i = 0; i < today.length; i++) {
      if (i > 0 && today[i].motion == today[i - 1].motion) continue;
      var end = i + 1;
      while (end < today.length && today[end].motion == today[i].motion) {
        end++;
      }
      final until = end < today.length ? today[end].recordedAt : now;
      final moving = today[i].motion == 'moving';
      periods.add(
        MotionPeriod(
          active: moving,
          minutes: until.difference(today[i].recordedAt).inMinutes,
          label: moving ? 'Moving' : 'Stationary',
        ),
      );
    }

    T? latest<T>(T? Function(CapReading reading) value) {
      for (final reading in readings.reversed) {
        final v = value(reading);
        if (v != null) return v;
      }
      return null;
    }

    return Vitals(
      heartRate: latest((r) => r.heartRateBpm),
      heartRateHistory: lastValues(
        since(const Duration(minutes: 30)).map((r) => r.heartRateBpm),
        30,
      ),
      bodyTemperature: latest((r) => r.bodyTempC),
      temperatureHistory: lastValues(
        since(const Duration(hours: 2)).map((r) => r.bodyTempC),
        24,
      ),
      motion: withMotion.isEmpty
          ? null
          : withMotion.last.motion == 'moving'
          ? MotionState.moving
          : MotionState.stationary,
      stillMinutes: stillMinutes,
      motionToday: periods,
      batteryPct: latest((r) => r.batteryPct),
      thresholds: thresholds,
    );
  }

  final int? heartRate;

  /// One reading a minute for the last 30 minutes, oldest first.
  final List<double> heartRateHistory;

  final double? bodyTemperature;

  /// One reading every 5 minutes for the last 2 hours, oldest first.
  final List<double> temperatureHistory;

  final MotionState? motion;

  /// How long the wearer has been in the current [motion] state.
  final int stillMinutes;

  /// Today's activity, oldest first.
  final List<MotionPeriod> motionToday;

  /// The cap's battery in the latest reading that had one, 0 to 100.
  final int? batteryPct;

  /// The admin's limits; a reading above one needs medical help.
  final VitalThresholds thresholds;

  static const int restingLow = 60;
  static const int restingHigh = 100;
  static const double normalTempLow = 36.1;
  static const double normalTempHigh = 37.5;

  /// Minutes without moving before the cap raises an inactivity alert.
  static const int inactivityAlertMinutes = 30;

  bool get heartRateBelowSafe =>
      heartRate != null && heartRate! < thresholds.heartRateMinBpm;

  bool get temperatureBelowSafe =>
      bodyTemperature != null && bodyTemperature! < thresholds.bodyTempMinC;

  List<VitalRange> get heartRateRanges {
    final max = thresholds.heartRateMaxBpm;
    return [
      const VitalRange('60–100 BPM', 'Normal resting rate', VitalStatus.stable),
      VitalRange(
        max > restingHigh ? '40–59 or 101–$max BPM' : '40–59 BPM',
        'Low or raised; keep an eye on it',
        VitalStatus.attention,
      ),
      VitalRange(
        'Below ${thresholds.heartRateMinBpm} or above $max BPM',
        'Get medical help',
        VitalStatus.unstable,
      ),
    ];
  }

  List<VitalRange> get temperatureRanges {
    final max = thresholds.bodyTempMaxC;
    final min = thresholds.bodyTempMinC;
    return [
      const VitalRange(
        '36.1–37.5 °C',
        'Normal body temperature',
        VitalStatus.stable,
      ),
      VitalRange(
        max > normalTempHigh ? '$min–36.0 or 37.6–$max °C' : '$min–36.0 °C',
        'Low or feverish; rest, hydrate, recheck',
        VitalStatus.attention,
      ),
      VitalRange(
        'Below $min or above $max °C',
        'Get medical help',
        VitalStatus.unstable,
      ),
    ];
  }

  /// Shown in place of a reading the cap has not sent.
  static const String placeholder = '--';

  /// No readings yet.
  static const Vitals empty = Vitals(
    heartRate: null,
    heartRateHistory: [],
    bodyTemperature: null,
    temperatureHistory: [],
    motion: null,
    stillMinutes: 0,
    motionToday: [],
  );

  static const Vitals sample = Vitals(
    heartRate: 80,
    heartRateHistory: [
      74, 75, 77, 76, 78, 81, 84, 88, 92, 95, 93, 89, 86, 84, 82, //
      80, 79, 78, 78, 77, 79, 81, 82, 80, 79, 78, 79, 81, 80, 80,
    ],
    bodyTemperature: 38.3,
    temperatureHistory: [
      36.8, 36.9, 36.9, 37.0, 37.1, 37.1, 37.3, 37.4, 37.6, 37.7, 37.8, //
      37.9, 38.0, 38.1, 38.1, 38.2, 38.2, 38.3, 38.2, 38.3, 38.3, 38.3,
      38.3, 38.3,
    ],
    motion: MotionState.stationary,
    stillMinutes: 4,
    motionToday: [
      MotionPeriod(active: false, minutes: 45, label: 'At the station'),
      MotionPeriod(active: true, minutes: 50, label: 'Foot patrol'),
      MotionPeriod(active: false, minutes: 25, label: 'Traffic post'),
      MotionPeriod(active: true, minutes: 35, label: 'Market patrol'),
      MotionPeriod(active: false, minutes: 20, label: 'Break'),
      MotionPeriod(active: true, minutes: 30, label: 'Foot patrol'),
      MotionPeriod(active: false, minutes: 4, label: 'Standing by'),
    ],
  );

  bool get hasReadings =>
      heartRate != null || bodyTemperature != null || motion != null;

  String get heartRateText => heartRate?.toString() ?? placeholder;

  String get bodyTemperatureText => bodyTemperature?.toString() ?? placeholder;

  String get motionText => motion?.label ?? placeholder;

  VitalStatus get heartRateStatus {
    final heartRate = this.heartRate;
    if (heartRate == null) return VitalStatus.noData;
    if (heartRate < thresholds.heartRateMinBpm ||
        heartRate > thresholds.heartRateMaxBpm) {
      return VitalStatus.unstable;
    }
    if (heartRate < restingLow || heartRate > restingHigh) {
      return VitalStatus.attention;
    }
    return VitalStatus.stable;
  }

  VitalStatus get temperatureStatus {
    final bodyTemperature = this.bodyTemperature;
    if (bodyTemperature == null) return VitalStatus.noData;
    if (bodyTemperature < thresholds.bodyTempMinC ||
        bodyTemperature > thresholds.bodyTempMaxC) {
      return VitalStatus.unstable;
    }
    if (bodyTemperature < normalTempLow || bodyTemperature > normalTempHigh) {
      return VitalStatus.attention;
    }
    return VitalStatus.stable;
  }

  VitalStatus get motionStatus {
    if (motion == null) return VitalStatus.noData;
    if (motion == MotionState.fallDetected) return VitalStatus.unstable;
    if (motion == MotionState.stationary &&
        stillMinutes >= inactivityAlertMinutes) {
      return VitalStatus.attention;
    }
    return VitalStatus.stable;
  }

  /// The most serious of the three; [VitalStatus.noData] only when none
  /// has a reading.
  VitalStatus get overall =>
      heartRateStatus.worst(temperatureStatus).worst(motionStatus);

  /// One line on why [overall] is what it is.
  String get overallReason {
    if (!hasReadings) return 'Waiting for readings from your Smart Cap';
    final heartRate = this.heartRate;
    final bodyTemperature = this.bodyTemperature;
    final dangerHeart = heartRateStatus == VitalStatus.unstable
        ? 'dangerously'
        : 'somewhat';
    final dangerTemp = temperatureStatus == VitalStatus.unstable
        ? 'dangerously'
        : 'somewhat';
    final reasons = [
      if (heartRate != null && heartRateStatus != VitalStatus.stable)
        heartRate > restingHigh
            ? 'Heart rate is $dangerHeart high ($heartRate BPM, safe up to '
                  '${thresholds.heartRateMaxBpm})'
            : 'Heart rate is $dangerHeart low ($heartRate BPM, safe from '
                  '${thresholds.heartRateMinBpm})',
      if (bodyTemperature != null && temperatureStatus != VitalStatus.stable)
        bodyTemperature > normalTempHigh
            ? 'Body temperature is $dangerTemp high ($bodyTemperature °C, '
                  'safe up to ${thresholds.bodyTempMaxC})'
            : 'Body temperature is $dangerTemp low ($bodyTemperature °C, '
                  'safe from ${thresholds.bodyTempMinC})',
      if (motion != null && motionStatus != VitalStatus.stable)
        motion == MotionState.fallDetected
            ? 'A fall was detected'
            : 'No movement for $stillMinutes min',
    ];
    return reasons.isEmpty
        ? 'All readings are within normal range'
        : reasons.join(' · ');
  }

  /// Short word for the temperature card.
  String get temperatureLabel {
    final bodyTemperature = this.bodyTemperature;
    if (bodyTemperature == null) return 'No reading yet';
    if (bodyTemperature > thresholds.bodyTempMaxC) return 'Too high';
    if (bodyTemperature < thresholds.bodyTempMinC) return 'Too low';
    if (bodyTemperature > normalTempHigh) return 'Elevated';
    if (bodyTemperature < normalTempLow) return 'Low';
    return 'Normal';
  }

  /// Short word for the heart rate card.
  String get heartRateLabel {
    final heartRate = this.heartRate;
    if (heartRate == null) return 'No reading yet';
    if (heartRate > thresholds.heartRateMaxBpm) return 'Too high';
    if (heartRate < thresholds.heartRateMinBpm) return 'Too low';
    if (heartRate > restingHigh) return 'High';
    if (heartRate < restingLow) return 'Low';
    return 'Normal';
  }
}
