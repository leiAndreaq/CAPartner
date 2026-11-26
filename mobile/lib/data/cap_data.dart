import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:latlong2/latlong.dart' show LatLng;
import 'package:path_provider/path_provider.dart';

import 'package:capartner/data/cap_reading.dart';
import 'package:capartner/data/local_database.dart';
import 'package:capartner/features/auth/auth_api.dart';
import 'package:capartner/features/camera/recorded_clip.dart';
import 'package:capartner/features/dashboard/vitals.dart';

/// The logged-in enforcer's cap data: what the cap sends, the SOS and health
/// alerts, and the camera clips.
///
/// Everything is stored in [LocalDatabase] first and then sent to the backend
/// by [sync], which runs right after each new record and every
/// [syncInterval] while [start]ed, so data taken without signal goes up once
/// the phone is back online.
///
/// [vitals] and [alerts] follow the database, for the dashboard and the
/// Alerts tab.
class CapData {
  CapData({
    required LocalDatabase database,
    required this._api,
    required this.owner,
    required this._token,
    this._clipsDirectory,
  }) : _db = database;

  final LocalDatabase _db;
  final AuthApi _api;
  final String _token;
  final Directory? _clipsDirectory;

  /// Email of the account the data belongs to.
  final String owner;

  static const Duration syncInterval = Duration(minutes: 1);

  /// How often a sent SOS is checked for the admin's acknowledgement.
  static const Duration ackInterval = Duration(seconds: 5);

  /// An SOS older than this is no longer waited on.
  static const Duration ackWindow = Duration(hours: 24);

  /// Readings per request to the backend.
  static const int batchSize = 100;

  final ValueNotifier<Vitals> vitals = ValueNotifier(Vitals.empty);
  final ValueNotifier<List<AlertRecord>> alerts = ValueNotifier(const []);

  Timer? _timer;
  Timer? _ackTimer;

  /// The sync in progress, if any.
  Future<void>? _running;
  bool _syncAgain = false;
  bool _stopped = false;

  /// Starts following the database and syncing.
  Future<void> start() async {
    _db.addListener(_refresh);
    _timer = Timer.periodic(syncInterval, (_) => sync());
    _ackTimer = Timer.periodic(ackInterval, (_) => checkAcknowledgements());
    await _refresh();
    unawaited(sync());
  }

  /// Stops syncing, as on logout, once the sync in progress is done. What is
  /// not sent yet stays stored and goes up at this account's next login.
  Future<void> stop() async {
    _stopped = true;
    _timer?.cancel();
    _ackTimer?.cancel();
    _db.removeListener(_refresh);
    await _running;
  }

  /// Stores a packet from the cap, the JSON in docs/cap-data-format.md.
  /// A reading without a `recordedAt`, from a cap that has no clock yet,
  /// gets the phone's time. Throws a [FormatException] for a malformed
  /// packet, which is not stored.
  Future<void> receiveJson(String packet) async {
    final json = jsonDecode(packet);
    if (json is! Map<String, dynamic>) {
      throw const FormatException('A packet must be a JSON object.');
    }
    if (json['type'] == 'sos') {
      await sendSos(
        origin: 'cap_button',
        holdSeconds: (json['holdSeconds'] as num?)?.round(),
      );
    } else {
      json['recordedAt'] ??= DateTime.now().toUtc().toIso8601String();
      await receive(CapReading.fromJson(json));
    }
  }

  /// Stores [reading]. A heart rate or temperature going over the admin's
  /// threshold, when the reading before was under it, raises a health alert;
  /// one that stays over does not raise another.
  Future<void> receive(CapReading reading) async {
    final thresholds = await _db.thresholds();
    final previous = await _db.latestReading(owner);
    if (!await _db.addReading(owner, reading)) return;

    final heartRate =
        thresholds.heartRateOut(reading) && !thresholds.heartRateOut(previous);
    final temperature =
        thresholds.temperatureOut(reading) &&
        !thresholds.temperatureOut(previous);
    if (heartRate || temperature) {
      await _db.addAlert(
        owner,
        _healthAlert(reading, thresholds, heartRate: heartRate),
      );
    }
    unawaited(sync());
  }

  /// A health alert for [reading]; about its heart rate when [heartRate],
  /// otherwise its temperature. The detail names every reading over.
  AlertRecord _healthAlert(
    CapReading reading,
    VitalThresholds thresholds, {
    required bool heartRate,
  }) {
    final reasons = [
      if (thresholds.heartRateTooHigh(reading))
        'Heart rate ${reading.heartRateBpm} BPM is above '
            '${thresholds.heartRateMaxBpm} BPM',
      if (thresholds.heartRateTooLow(reading))
        'Heart rate ${reading.heartRateBpm} BPM is below '
            '${thresholds.heartRateMinBpm} BPM',
      if (thresholds.temperatureTooHigh(reading))
        'Body temperature ${reading.bodyTempC} °C is above '
            '${thresholds.bodyTempMaxC} °C',
      if (thresholds.temperatureTooLow(reading))
        'Body temperature ${reading.bodyTempC} °C is below '
            '${thresholds.bodyTempMinC} °C',
    ];
    return AlertRecord(
      eventUid: _uuid(),
      type: 'health',
      origin: 'vitals_rule',
      title: heartRate
          ? (thresholds.heartRateTooLow(reading)
                ? 'Low heart rate detected'
                : 'Elevated heart rate detected')
          : (thresholds.temperatureTooLow(reading)
                ? 'Low body temperature detected'
                : 'High body temperature detected'),
      detail: reasons.join(' · '),
      occurredAt: reading.recordedAt,
      latitude: reading.latitude,
      longitude: reading.longitude,
      heartRateBpm: reading.heartRateBpm,
      bodyTempC: reading.bodyTempC,
    );
  }

  /// Asks the backend whether the admin acknowledged each SOS that was sent
  /// to them, and stores the answer so the SOS screen and the Alerts tab
  /// show it. Does nothing when no SOS is waiting, and tries again later when
  /// the backend is out of reach.
  Future<void> checkAcknowledgements() async {
    if (_stopped) return;
    final since = DateTime.now().toUtc().subtract(ackWindow);
    for (final alert in await _db.alerts(owner)) {
      if (_stopped) return;
      if (alert.type != 'sos' ||
          alert.syncState != SyncState.sent ||
          alert.acknowledgedAt != null ||
          alert.occurredAt.isBefore(since)) {
        continue;
      }
      try {
        final at = await _api.alertAcknowledgedAt(_token, alert.eventUid);
        if (at != null) await _db.markAlertAcknowledged(alert.eventUid, at);
      } on ApiException {
        return;
      }
    }
  }

  /// Raises an SOS from the app's SOS button, or the cap's
  /// ([origin] "cap_button"), at [phonePosition] from the phone's GPS, or
  /// else the cap's last known position. Returns the new alert's id.
  Future<String> sendSos({
    String origin = 'mobile_app',
    int? holdSeconds,
    LatLng? phonePosition,
  }) async {
    final latest = await _db.latestReading(owner);
    final eventUid = _uuid();
    await _db.addAlert(
      owner,
      AlertRecord(
        eventUid: eventUid,
        type: 'sos',
        origin: origin,
        title: 'Manual SOS sent',
        detail: origin == 'cap_button'
            ? 'SOS button pressed on the Smart Cap'
            : 'SOS sent from the CAPartner app',
        occurredAt: DateTime.now().toUtc(),
        latitude: phonePosition?.latitude ?? latest?.latitude,
        longitude: phonePosition?.longitude ?? latest?.longitude,
        heartRateBpm: latest?.heartRateBpm,
        bodyTempC: latest?.bodyTempC,
        sosHoldSeconds: holdSeconds,
      ),
    );
    unawaited(sync());
    return eventUid;
  }

  /// Logs that this account tried to pair [attemptedCap], which is not the
  /// cap the admin assigned to it ([assignedCap], empty when none is). It is
  /// stored on the phone and sent to the admin like any alert, so both the
  /// admin and the enforcer can see what happened.
  Future<void> reportUnauthorizedPairing({
    required String attemptedCap,
    required String assignedCap,
  }) async {
    await _db.addAlert(
      owner,
      AlertRecord(
        eventUid: _uuid(),
        type: 'device',
        origin: 'system',
        title: 'Unauthorized cap pairing attempt',
        detail: assignedCap.isEmpty
            ? '$owner tried to pair $attemptedCap but has no cap assigned'
            : '$owner tried to pair $attemptedCap, which is not their '
                  'assigned cap ($assignedCap)',
        occurredAt: DateTime.now().toUtc(),
      ),
    );
    unawaited(sync());
  }

  /// Moves a clip from the camera's temporary file into the app's own
  /// storage, so it outlives the app, and queues it for upload.
  Future<RecordedClip> saveClip(RecordedClip clip) async {
    final directory =
        _clipsDirectory ??
        Directory(
          p.join((await getApplicationDocumentsDirectory()).path, 'clips'),
        );
    await directory.create(recursive: true);
    final id = _uuid();
    final stored = await _move(
      File(clip.path),
      p.join(directory.path, '$id.mp4'),
    );
    final saved = RecordedClip(
      id: id,
      path: stored.path,
      recordedAt: clip.recordedAt,
      length: clip.length,
    );
    await _db.addClip(owner, saved);
    unawaited(sync());
    return saved;
  }

  Future<File> _move(File file, String to) async {
    try {
      return await file.rename(to);
    } on FileSystemException {
      // Another storage volume: copy instead.
      final copy = await file.copy(to);
      await file.delete();
      return copy;
    }
  }

  /// [owner]'s stored clips, newest first.
  Future<List<RecordedClip>> clips() => _db.clips(owner);

  /// Sends everything waiting, oldest first: the thresholds are fetched, then
  /// readings, alerts and clips go up. Stops at the first sign the server is
  /// out of reach, to try again later. Called while a sync is running, it
  /// waits for that one, which then goes round once more for what is new.
  Future<void> sync() {
    if (_stopped) return Future.value();
    final running = _running;
    if (running != null) {
      _syncAgain = true;
      return running;
    }
    return _running = _syncLoop().whenComplete(() => _running = null);
  }

  Future<void> _syncLoop() async {
    try {
      do {
        _syncAgain = false;
        await _syncOnce();
      } while (_syncAgain && !_stopped);
    } on ApiException {
      // Out of reach or logged out: the timer tries again.
    }
  }

  Future<void> _syncOnce() async {
    // Alerts go first, so an SOS is never held up by the thresholds fetch
    // or the readings upload failing.
    for (final alert in await _db.alerts(owner, pendingOnly: true)) {
      if (_stopped) return;
      await _send(
        () => _api.sendAlert(_token, alert),
        (state, [error]) => _db.markAlert(alert.eventUid, state, error),
      );
    }

    await _db.saveThresholds(await _api.fetchThresholds(_token));

    while (!_stopped) {
      final pending = await _db.pendingReadings(owner, batchSize);
      if (pending.isEmpty) break;
      try {
        await _api.sendReadings(_token, pending.values.toList());
        await _db.markReadings(pending.keys, SyncState.sent);
      } on ApiException catch (e) {
        // No cap assigned yet: readings wait, but alerts can still go up.
        if (e.statusCode == 409) break;
        if (!_isRejection(e)) rethrow;
        await _db.markReadings(pending.keys, SyncState.rejected, e.message);
      }
    }

    for (final clip in await _db.clips(owner, pendingOnly: true)) {
      if (_stopped) return;
      await _send(
        () => _api.uploadClip(_token, clip),
        (state, [error]) => _db.markClip(clip.id, state, error),
      );
    }
    await _db.prune();
  }

  Future<void> _send(
    Future<void> Function() request,
    Future<void> Function(SyncState state, [String? error]) mark,
  ) async {
    try {
      await request();
      await mark(SyncState.sent);
    } on ApiException catch (e) {
      if (!_isRejection(e)) rethrow;
      await mark(SyncState.rejected, e.message);
    } on FileSystemException catch (e) {
      // The clip's file is gone; there is nothing left to send.
      await mark(SyncState.rejected, e.message);
    }
  }

  /// Whether the server turned the data itself down, so re-sending it can
  /// never work. Not when it is out of reach, the login ended (401), or no
  /// cap is assigned yet (409): those can change.
  bool _isRejection(ApiException e) =>
      e.statusCode == 400 || e.statusCode == 413 || e.statusCode == 415;

  Future<void> _refresh() async {
    final now = DateTime.now().toUtc();
    final thresholds = await _db.thresholds();
    final today = await _db.readingsSince(
      owner,
      now.subtract(const Duration(hours: 24)),
    );
    final alerts = await _db.alerts(owner);
    if (_stopped) return;
    vitals.value = Vitals.fromReadings(today, thresholds: thresholds, now: now);
    this.alerts.value = alerts;
  }

  static final Random _random = Random.secure();

  /// A random (version 4) UUID.
  static String _uuid() {
    final bytes = List.generate(16, (_) => _random.nextInt(256));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    final hex = [for (final b in bytes) b.toRadixString(16).padLeft(2, '0')];
    return [
      hex.sublist(0, 4).join(),
      hex.sublist(4, 6).join(),
      hex.sublist(6, 8).join(),
      hex.sublist(8, 10).join(),
      hex.sublist(10).join(),
    ].join('-');
  }
}
