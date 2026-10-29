import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:latlong2/latlong.dart' show LatLng;

import 'package:capartner/data/cap_data.dart';
import 'package:capartner/data/cap_reading.dart';
import 'package:capartner/data/local_database.dart';
import 'package:capartner/features/camera/recorded_clip.dart';
import 'package:capartner/features/dashboard/vitals.dart';

import 'fake_backend.dart';

void main() {
  late FakeBackend backend;
  late LocalDatabase database;
  late Directory clips;
  late CapData data;

  /// A reading [minutesAgo] minutes old.
  String packet(
    int minutesAgo, {
    int? heartRate,
    double? temp,
    String? motion,
  }) => jsonEncode({
    'recordedAt': DateTime.now()
        .toUtc()
        .subtract(Duration(minutes: minutesAgo))
        .toIso8601String(),
    'heartRateBpm': ?heartRate,
    'bodyTempC': ?temp,
    'motion': ?motion,
    'latitude': 14.7534,
    'longitude': 121.0437,
    'batteryPct': 70,
  });

  setUp(() async {
    backend = FakeBackend();
    database = await testDatabase();
    clips = Directory.systemTemp.createTempSync('capartner_clips');
    data = CapData(
      database: database,
      api: backend.api(),
      owner: 'user@gmail.com',
      token: 'token-1',
      clipsDirectory: clips,
    );
    await data.start();
  });

  tearDown(() async {
    await data.stop();
    await database.close();
  });

  test('Cap packets are stored and sent to the backend once', () async {
    final second = packet(1, heartRate: 82, motion: 'moving');
    await data.receiveJson(packet(2, heartRate: 80, temp: 36.8));
    await data.receiveJson(second);
    // The cap re-sending a packet changes nothing.
    await data.receiveJson(second);
    await data.sync();

    expect(backend.readings, hasLength(2));
    expect(backend.readings.last['heartRateBpm'], 82);
    expect(await database.pendingReadings('user@gmail.com', 10), isEmpty);
  });

  test('Bad packets are refused and never stored', () async {
    expect(
      () => data.receiveJson(packet(1, heartRate: 999)),
      throwsA(isA<FormatException>()),
    );
    expect(
      () => data.receiveJson('{"recordedAt": "yesterday"}'),
      throwsA(isA<FormatException>()),
    );
    expect(await database.latestReading('user@gmail.com'), isNull);
  });

  test("A reading without a time gets the phone's", () async {
    final before = DateTime.now().toUtc();
    await data.receiveJson('{"heartRateBpm": 80}');
    final reading = await database.latestReading('user@gmail.com');
    expect(reading!.heartRateBpm, 80);
    expect(reading.recordedAt.isBefore(before), isFalse);
  });

  test('Readings wait on the phone while offline, then go up', () async {
    backend.online = false;
    await data.receiveJson(packet(3, heartRate: 75));
    await data.receiveJson(packet(2, heartRate: 76));
    await data.sync();
    expect(backend.readings, isEmpty);
    expect(await database.pendingReadings('user@gmail.com', 10), hasLength(2));

    backend.online = true;
    await data.sync();
    expect(backend.readings, hasLength(2));
  });

  test('Without an assigned cap, readings wait but alerts still go', () async {
    backend.capAssigned = false;
    await data.receiveJson(packet(1, heartRate: 80));
    await data.sendSos(holdSeconds: 2);
    await data.sync();

    expect(backend.readings, isEmpty);
    expect(backend.alerts.single['type'], 'sos');
    expect(await database.pendingReadings('user@gmail.com', 10), hasLength(1));
  });

  test('The admin thresholds raise one health alert per crossing', () async {
    backend.settings = {
      'heartRateMaxBpm': 110,
      'bodyTempMaxC': 37.8,
      'lowBatteryPct': 15,
    };
    await data.sync();
    expect((await database.thresholds()).heartRateMaxBpm, 110);

    await data.receiveJson(packet(4, heartRate: 100));
    await data.receiveJson(packet(3, heartRate: 115));
    // Still high: no second alert.
    await data.receiveJson(packet(2, heartRate: 118));
    await data.receiveJson(packet(1, heartRate: 90, temp: 38.2));
    await data.sync();

    expect(backend.alerts.map((a) => a['title']), [
      'Elevated heart rate detected',
      'High body temperature detected',
    ]);
    expect(backend.alerts.first['origin'], 'vitals_rule');
    expect(backend.alerts.first['heartRateBpm'], 115);
  });

  test(
    'A reading below the safe range raises one alert, like a high one',
    () async {
      await data.receiveJson(packet(3, temp: 36.5));
      await data.receiveJson(packet(2, temp: 29.2));
      // Still low: no second alert.
      await data.receiveJson(packet(1, temp: 29.0));
      await data.sync();

      expect(backend.alerts.map((a) => a['title']), [
        'Low body temperature detected',
      ]);
      expect(backend.alerts.single['detail'], contains('below 30.0'));
    },
  );

  test('An SOS from the app or the cap reaches the backend', () async {
    await data.receiveJson(packet(1, heartRate: 80));
    await data.sendSos(holdSeconds: 2);
    await data.receiveJson('{"type": "sos", "holdSeconds": 3}');
    await data.sync();

    expect(backend.alerts.map((a) => a['origin']), [
      'mobile_app',
      'cap_button',
    ]);
    // Sent with where the cap last was.
    expect(backend.alerts.first['latitude'], 14.7534);
    expect(
      (await database.alerts('user@gmail.com')).map((a) => a.syncState),
      everyElement(SyncState.sent),
    );
  });

  test("An SOS goes with the phone's GPS position when it has one", () async {
    await data.receiveJson(packet(1, heartRate: 80));
    await data.sendSos(phonePosition: const LatLng(14.76, 121.05));
    await data.sync();

    expect(backend.alerts.single['latitude'], 14.76);
    expect(backend.alerts.single['longitude'], 121.05);
    // The vitals still come from the cap.
    expect(backend.alerts.single['heartRateBpm'], 80);
  });

  test(
    'A pairing attempt on a cap that is not theirs is logged and sent',
    () async {
      await data.reportUnauthorizedPairing(
        attemptedCap: 'CAP-001',
        assignedCap: 'CAP-002',
      );
      await data.sync();

      final stored = await database.alerts('user@gmail.com');
      expect(stored.single.title, 'Unauthorized cap pairing attempt');
      expect(stored.single.syncState, SyncState.sent);
      expect(backend.alerts.single['type'], 'device');
      expect(backend.alerts.single['origin'], 'system');
      expect(backend.alerts.single['detail'], contains('CAP-001'));
      expect(backend.alerts.single['detail'], contains('CAP-002'));
    },
  );

  test('An SOS shows as acknowledged once the admin acknowledges it', () async {
    final uid = await data.sendSos(holdSeconds: 2);
    await data.sync();

    // Sent, but the admin has not answered.
    await data.checkAcknowledgements();
    var alert = (await database.alerts('user@gmail.com')).single;
    expect(alert.syncState, SyncState.sent);
    expect(alert.acknowledgedAt, isNull);

    backend.acknowledged.add(uid);
    await data.checkAcknowledgements();
    alert = (await database.alerts('user@gmail.com')).single;
    expect(alert.acknowledgedAt, DateTime.utc(2026, 10, 29, 8));
  });

  test('An SOS that never reached the admin is not checked', () async {
    backend.online = false;
    final uid = await data.sendSos();
    backend.acknowledged.add(uid);
    await data.checkAcknowledgements();
    expect(
      (await database.alerts('user@gmail.com')).single.acknowledgedAt,
      isNull,
    );
  });

  test('Clips are kept in app storage and uploaded', () async {
    final recorded = File('${clips.path}/camera_temp.mp4')
      ..writeAsBytesSync(List.filled(2048, 1));
    final saved = await data.saveClip(
      RecordedClip(
        path: recorded.path,
        recordedAt: DateTime.now(),
        length: const Duration(seconds: 12),
      ),
    );
    await data.sync();

    expect(recorded.existsSync(), isFalse);
    expect(File(saved.path).existsSync(), isTrue);
    expect(backend.clips[saved.id], 2048);
    expect((await data.clips()).single.syncState, SyncState.sent);
  });

  test('Another account never sends this account\'s data', () async {
    await data.receiveJson(packet(1, heartRate: 80));
    final other = CapData(
      database: database,
      api: backend.api(),
      owner: 'someone@gmail.com',
      token: 'token-2',
    );
    await data.stop();
    await other.start();
    await other.sync();
    await other.stop();

    expect(backend.readings, isEmpty);
  });

  test('The dashboard follows the stored readings', () async {
    await data.receiveJson(packet(20, heartRate: 70, motion: 'moving'));
    await data.receiveJson(packet(10, heartRate: 75, motion: 'stationary'));
    await data.receiveJson(packet(1, heartRate: 78, temp: 37.0));
    await Future<void>.delayed(Duration.zero);

    final vitals = data.vitals.value;
    expect(vitals.heartRate, 78);
    expect(vitals.bodyTemperature, 37.0);
    expect(vitals.heartRateHistory, [70, 75, 78]);
    expect(vitals.motion, MotionState.stationary);
    expect(vitals.stillMinutes, 10);
    expect(vitals.overall, VitalStatus.stable);
  });

  test('Readings above the admin thresholds show as unstable', () {
    const thresholds = VitalThresholds(heartRateMaxBpm: 110);
    final reading = CapReading(
      recordedAt: DateTime.now().toUtc(),
      heartRateBpm: 115,
    );
    final vitals = Vitals.fromReadings(
      [reading],
      thresholds: thresholds,
      now: DateTime.now().toUtc(),
    );
    expect(vitals.heartRateStatus, VitalStatus.unstable);
    expect(vitals.heartRateRanges.last.label, 'Below 40 or above 110 BPM');
  });
}
