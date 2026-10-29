/// One reading from the Smart Cap, as the cap sends it to the phone and the
/// phone sends it on to the backend (see docs/cap-data-format.md).
///
/// Every sensor value is optional, so a cap with a sensor still missing can
/// send what it has.
class CapReading {
  const CapReading({
    required this.recordedAt,
    this.heartRateBpm,
    this.bodyTempC,
    this.motion,
    this.latitude,
    this.longitude,
    this.batteryPct,
    this.connection = 'internet',
  });

  /// Reads the JSON the cap sends. Throws a [FormatException] saying what is
  /// wrong, so a bad packet is never stored.
  factory CapReading.fromJson(Map<String, dynamic> json) {
    T? read<T extends num>(String key, num min, num max) {
      final value = json[key];
      if (value == null) return null;
      if (value is! num || value < min || value > max) {
        throw FormatException('$key must be a number from $min to $max.');
      }
      return (T == int ? value.round() : value.toDouble()) as T;
    }

    final recordedAt = DateTime.tryParse('${json['recordedAt']}');
    if (recordedAt == null) {
      throw const FormatException('recordedAt must be an ISO 8601 time.');
    }
    final motion = json['motion'];
    if (motion != null && !motions.contains(motion)) {
      throw FormatException('motion must be one of ${motions.join(', ')}.');
    }
    final connection = json['connection'] ?? 'internet';
    if (!connections.contains(connection)) {
      throw FormatException(
        'connection must be one of ${connections.join(', ')}.',
      );
    }
    return CapReading(
      recordedAt: recordedAt.toUtc(),
      heartRateBpm: read<int>('heartRateBpm', 0, 300),
      bodyTempC: read<double>('bodyTempC', 25, 45),
      motion: motion as String?,
      latitude: read<double>('latitude', -90, 90),
      longitude: read<double>('longitude', -180, 180),
      batteryPct: read<int>('batteryPct', 0, 100),
      connection: connection as String,
    );
  }

  static const List<String> motions = ['moving', 'stationary'];
  static const List<String> connections = ['internet', 'lora', 'offline'];

  /// When the cap took the reading, in UTC.
  final DateTime recordedAt;
  final int? heartRateBpm;
  final double? bodyTempC;

  /// "moving" or "stationary".
  final String? motion;
  final double? latitude;
  final double? longitude;
  final int? batteryPct;

  /// How the cap was connected: "internet", "lora" or "offline".
  final String connection;

  Map<String, Object?> toJson() => {
    'recordedAt': recordedAt.toUtc().toIso8601String(),
    'heartRateBpm': heartRateBpm,
    'bodyTempC': bodyTempC,
    'motion': motion,
    'latitude': latitude,
    'longitude': longitude,
    'batteryPct': batteryPct,
    'connection': connection,
  };
}

/// The admin's limits for the vital signs, set in the web app's settings.
/// A reading above a limit raises a health alert.
class VitalThresholds {
  const VitalThresholds({
    this.heartRateMaxBpm = 120,
    this.bodyTempMaxC = 38.0,
    this.lowBatteryPct = 20,
    this.heartRateMinBpm = 40,
    this.bodyTempMinC = 30.0,
  });

  /// The backend's answer to GET /enforcer/settings.
  factory VitalThresholds.fromJson(Map<String, dynamic> json) =>
      VitalThresholds(
        heartRateMaxBpm: (json['heartRateMaxBpm'] as num).round(),
        bodyTempMaxC: (json['bodyTempMaxC'] as num).toDouble(),
        lowBatteryPct: (json['lowBatteryPct'] as num).round(),
      );

  /// The backend's own defaults, used until the admin's are fetched.
  static const VitalThresholds defaults = VitalThresholds();

  final int heartRateMaxBpm;
  final double bodyTempMaxC;
  final int lowBatteryPct;

  /// Below these a reading needs medical help. The admin only sets the upper
  /// limits, so these are fixed, and used everywhere a reading is judged: the
  /// dashboard, its texts and the alerts to the admin.
  final int heartRateMinBpm;
  final double bodyTempMinC;

  bool heartRateTooHigh(CapReading? reading) =>
      (reading?.heartRateBpm ?? 0) > heartRateMaxBpm;

  bool temperatureTooHigh(CapReading? reading) =>
      (reading?.bodyTempC ?? 0) > bodyTempMaxC;

  /// A missing reading is not a low one.
  bool heartRateTooLow(CapReading? reading) {
    final bpm = reading?.heartRateBpm;
    return bpm != null && bpm < heartRateMinBpm;
  }

  bool temperatureTooLow(CapReading? reading) {
    final temp = reading?.bodyTempC;
    return temp != null && temp < bodyTempMinC;
  }

  /// Outside the safe range, either way.
  bool heartRateOut(CapReading? reading) =>
      heartRateTooHigh(reading) || heartRateTooLow(reading);

  bool temperatureOut(CapReading? reading) =>
      temperatureTooHigh(reading) || temperatureTooLow(reading);
}
