import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';

export 'package:capartner/data/sync_state.dart';

import 'package:capartner/data/cap_reading.dart';
import 'package:capartner/data/sync_state.dart';
import 'package:capartner/features/camera/recorded_clip.dart';

/// An SOS or health alert raised on this phone.
class AlertRecord {
  const AlertRecord({
    required this.eventUid,
    required this.type,
    required this.origin,
    required this.title,
    required this.detail,
    required this.occurredAt,
    this.latitude,
    this.longitude,
    this.heartRateBpm,
    this.bodyTempC,
    this.sosHoldSeconds,
    this.syncState = SyncState.pending,
    this.syncError,
    this.acknowledgedAt,
  });

  /// Made once on the phone, so a re-sent alert is only saved once.
  final String eventUid;

  /// "sos" or "health".
  final String type;

  /// "mobile_app", "cap_button" or "vitals_rule".
  final String origin;
  final String title;
  final String detail;
  final DateTime occurredAt;
  final double? latitude;
  final double? longitude;
  final int? heartRateBpm;
  final double? bodyTempC;
  final int? sosHoldSeconds;
  final SyncState syncState;
  final String? syncError;

  /// When the admin acknowledged it; null while they have not.
  final DateTime? acknowledgedAt;

  Map<String, Object?> toJson() => {
    'eventUid': eventUid,
    'type': type,
    'origin': origin,
    'title': title,
    'detail': detail,
    'occurredAt': occurredAt.toUtc().toIso8601String(),
    'latitude': latitude,
    'longitude': longitude,
    'heartRateBpm': heartRateBpm,
    'bodyTempC': bodyTempC,
    'sosHoldSeconds': sosHoldSeconds,
  };
}

/// The phone's own SQLite database: cap readings, alerts and camera clips
/// wait here until the backend has them, so nothing is lost without signal,
/// and the admin's thresholds are kept for offline use.
///
/// Every record belongs to the account that was logged in when it was made
/// ([owner], its email), and only goes to the server under that login.
/// Listeners are told after every change.
class LocalDatabase extends ChangeNotifier {
  LocalDatabase._(this._db);

  /// Opens the database file in the app's private storage, or the one at
  /// [path] with [factory], as tests do.
  static Future<LocalDatabase> open({
    String? path,
    DatabaseFactory? factory,
  }) async {
    final databases = factory ?? databaseFactory;
    final file =
        path ?? p.join(await databases.getDatabasesPath(), 'capartner.db');
    final db = await databases.openDatabase(
      file,
      options: OpenDatabaseOptions(
        version: 2,
        onCreate: _create,
        onUpgrade: _upgrade,
      ),
    );
    return LocalDatabase._(db);
  }

  final Database _db;

  /// Sent readings older than this are deleted; the backend keeps them.
  static const Duration keepSentReadings = Duration(days: 7);

  static Future<void> _upgrade(Database db, int from, int to) async {
    if (from < 2) {
      await db.execute('ALTER TABLE alerts ADD COLUMN acknowledged_at TEXT');
    }
  }

  static Future<void> _create(Database db, int version) async {
    final batch = db.batch()
      ..execute('''
        CREATE TABLE readings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          owner TEXT NOT NULL,
          recorded_at TEXT NOT NULL,
          heart_rate_bpm INTEGER,
          body_temp_c REAL,
          motion TEXT,
          latitude REAL,
          longitude REAL,
          battery_pct INTEGER,
          connection TEXT NOT NULL,
          sync_state TEXT NOT NULL DEFAULT 'pending',
          sync_error TEXT,
          UNIQUE (owner, recorded_at)
        )''')
      ..execute(
        'CREATE INDEX idx_readings_owner_time ON readings (owner, recorded_at)',
      )
      ..execute('''
        CREATE TABLE alerts (
          event_uid TEXT PRIMARY KEY,
          owner TEXT NOT NULL,
          type TEXT NOT NULL,
          origin TEXT NOT NULL,
          title TEXT NOT NULL,
          detail TEXT NOT NULL,
          occurred_at TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          heart_rate_bpm INTEGER,
          body_temp_c REAL,
          sos_hold_seconds INTEGER,
          sync_state TEXT NOT NULL DEFAULT 'pending',
          sync_error TEXT,
          acknowledged_at TEXT
        )''')
      ..execute('''
        CREATE TABLE clips (
          event_uid TEXT PRIMARY KEY,
          owner TEXT NOT NULL,
          path TEXT NOT NULL,
          recorded_at TEXT NOT NULL,
          length_ms INTEGER NOT NULL,
          sync_state TEXT NOT NULL DEFAULT 'pending',
          sync_error TEXT
        )''')
      ..execute('''
        CREATE TABLE thresholds (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          heart_rate_max_bpm INTEGER NOT NULL,
          body_temp_max_c REAL NOT NULL,
          low_battery_pct INTEGER NOT NULL,
          fetched_at TEXT NOT NULL
        )''');
    await batch.commit(noResult: true);
  }

  String _key(String owner) => owner.trim().toLowerCase();

  // READINGS

  /// Stores [reading]; false when one with the same time is already stored,
  /// as when the cap re-sends it.
  Future<bool> addReading(String owner, CapReading reading) async {
    final id = await _db.insert('readings', {
      'owner': _key(owner),
      'recorded_at': reading.recordedAt.toUtc().toIso8601String(),
      'heart_rate_bpm': reading.heartRateBpm,
      'body_temp_c': reading.bodyTempC,
      'motion': reading.motion,
      'latitude': reading.latitude,
      'longitude': reading.longitude,
      'battery_pct': reading.batteryPct,
      'connection': reading.connection,
    }, conflictAlgorithm: ConflictAlgorithm.ignore);
    if (id == 0) return false;
    notifyListeners();
    return true;
  }

  /// [owner]'s readings taken since [since], oldest first.
  Future<List<CapReading>> readingsSince(String owner, DateTime since) async {
    final rows = await _db.query(
      'readings',
      where: 'owner = ? AND recorded_at >= ?',
      whereArgs: [_key(owner), since.toUtc().toIso8601String()],
      orderBy: 'recorded_at',
    );
    return rows.map(_reading).toList();
  }

  /// [owner]'s newest reading, if any.
  Future<CapReading?> latestReading(String owner) async {
    final rows = await _db.query(
      'readings',
      where: 'owner = ?',
      whereArgs: [_key(owner)],
      orderBy: 'recorded_at DESC',
      limit: 1,
    );
    return rows.isEmpty ? null : _reading(rows.first);
  }

  /// Up to [limit] of [owner]'s unsent readings, oldest first, by row id.
  Future<Map<int, CapReading>> pendingReadings(String owner, int limit) async {
    final rows = await _db.query(
      'readings',
      where: "owner = ? AND sync_state = 'pending'",
      whereArgs: [_key(owner)],
      orderBy: 'recorded_at',
      limit: limit,
    );
    return {for (final row in rows) row['id'] as int: _reading(row)};
  }

  Future<void> markReadings(
    Iterable<int> ids,
    SyncState state, [
    String? error,
  ]) async {
    if (ids.isEmpty) return;
    await _db.update(
      'readings',
      {'sync_state': state.name, 'sync_error': error},
      where: 'id IN (${List.filled(ids.length, '?').join(',')})',
      whereArgs: ids.toList(),
    );
  }

  /// Deletes sent readings older than [keepSentReadings].
  Future<void> prune() async {
    final cutoff = DateTime.now().toUtc().subtract(keepSentReadings);
    await _db.delete(
      'readings',
      where: "sync_state = 'sent' AND recorded_at < ?",
      whereArgs: [cutoff.toIso8601String()],
    );
  }

  CapReading _reading(Map<String, Object?> row) => CapReading(
    recordedAt: DateTime.parse(row['recorded_at'] as String),
    heartRateBpm: row['heart_rate_bpm'] as int?,
    bodyTempC: (row['body_temp_c'] as num?)?.toDouble(),
    motion: row['motion'] as String?,
    latitude: (row['latitude'] as num?)?.toDouble(),
    longitude: (row['longitude'] as num?)?.toDouble(),
    batteryPct: row['battery_pct'] as int?,
    connection: row['connection'] as String,
  );

  // ALERTS

  Future<void> addAlert(String owner, AlertRecord alert) async {
    await _db.insert('alerts', {
      'event_uid': alert.eventUid,
      'owner': _key(owner),
      'type': alert.type,
      'origin': alert.origin,
      'title': alert.title,
      'detail': alert.detail,
      'occurred_at': alert.occurredAt.toUtc().toIso8601String(),
      'latitude': alert.latitude,
      'longitude': alert.longitude,
      'heart_rate_bpm': alert.heartRateBpm,
      'body_temp_c': alert.bodyTempC,
      'sos_hold_seconds': alert.sosHoldSeconds,
    }, conflictAlgorithm: ConflictAlgorithm.ignore);
    notifyListeners();
  }

  /// [owner]'s alerts, newest first; with [pendingOnly], only those waiting
  /// to be sent, oldest first.
  Future<List<AlertRecord>> alerts(
    String owner, {
    bool pendingOnly = false,
  }) async {
    final rows = await _db.query(
      'alerts',
      where: pendingOnly ? "owner = ? AND sync_state = 'pending'" : 'owner = ?',
      whereArgs: [_key(owner)],
      orderBy: pendingOnly ? 'occurred_at' : 'occurred_at DESC',
    );
    return [
      for (final row in rows)
        AlertRecord(
          eventUid: row['event_uid'] as String,
          type: row['type'] as String,
          origin: row['origin'] as String,
          title: row['title'] as String,
          detail: row['detail'] as String,
          occurredAt: DateTime.parse(row['occurred_at'] as String),
          latitude: (row['latitude'] as num?)?.toDouble(),
          longitude: (row['longitude'] as num?)?.toDouble(),
          heartRateBpm: row['heart_rate_bpm'] as int?,
          bodyTempC: (row['body_temp_c'] as num?)?.toDouble(),
          sosHoldSeconds: row['sos_hold_seconds'] as int?,
          syncState: SyncState.values.byName(row['sync_state'] as String),
          syncError: row['sync_error'] as String?,
          acknowledgedAt: switch (row['acknowledged_at']) {
            final String at => DateTime.parse(at),
            _ => null,
          },
        ),
    ];
  }

  /// Records that the admin acknowledged the alert at [at].
  Future<void> markAlertAcknowledged(String eventUid, DateTime at) async {
    await _db.update(
      'alerts',
      {'acknowledged_at': at.toUtc().toIso8601String()},
      where: 'event_uid = ?',
      whereArgs: [eventUid],
    );
    notifyListeners();
  }

  Future<void> markAlert(
    String eventUid,
    SyncState state, [
    String? error,
  ]) async {
    await _db.update(
      'alerts',
      {'sync_state': state.name, 'sync_error': error},
      where: 'event_uid = ?',
      whereArgs: [eventUid],
    );
    notifyListeners();
  }

  // CLIPS

  Future<void> addClip(String owner, RecordedClip clip) async {
    await _db.insert('clips', {
      'event_uid': clip.id,
      'owner': _key(owner),
      'path': clip.path,
      'recorded_at': clip.recordedAt.toUtc().toIso8601String(),
      'length_ms': clip.length.inMilliseconds,
    }, conflictAlgorithm: ConflictAlgorithm.ignore);
    notifyListeners();
  }

  /// [owner]'s clips, newest first; with [pendingOnly], only those waiting
  /// to be uploaded, oldest first.
  Future<List<RecordedClip>> clips(
    String owner, {
    bool pendingOnly = false,
  }) async {
    final rows = await _db.query(
      'clips',
      where: pendingOnly ? "owner = ? AND sync_state = 'pending'" : 'owner = ?',
      whereArgs: [_key(owner)],
      orderBy: pendingOnly ? 'recorded_at' : 'recorded_at DESC',
    );
    return [
      for (final row in rows)
        RecordedClip(
          id: row['event_uid'] as String,
          path: row['path'] as String,
          recordedAt: DateTime.parse(row['recorded_at'] as String).toLocal(),
          length: Duration(milliseconds: row['length_ms'] as int),
          syncState: SyncState.values.byName(row['sync_state'] as String),
        ),
    ];
  }

  Future<void> markClip(String id, SyncState state, [String? error]) async {
    await _db.update(
      'clips',
      {'sync_state': state.name, 'sync_error': error},
      where: 'event_uid = ?',
      whereArgs: [id],
    );
    notifyListeners();
  }

  // THRESHOLDS

  Future<void> saveThresholds(VitalThresholds thresholds) async {
    await _db.insert('thresholds', {
      'id': 1,
      'heart_rate_max_bpm': thresholds.heartRateMaxBpm,
      'body_temp_max_c': thresholds.bodyTempMaxC,
      'low_battery_pct': thresholds.lowBatteryPct,
      'fetched_at': DateTime.now().toUtc().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
    notifyListeners();
  }

  /// The admin's thresholds as last fetched, or the defaults before then.
  Future<VitalThresholds> thresholds() async {
    final rows = await _db.query('thresholds', limit: 1);
    if (rows.isEmpty) return VitalThresholds.defaults;
    final row = rows.first;
    return VitalThresholds(
      heartRateMaxBpm: row['heart_rate_max_bpm'] as int,
      bodyTempMaxC: (row['body_temp_max_c'] as num).toDouble(),
      lowBatteryPct: row['low_battery_pct'] as int,
    );
  }

  Future<void> close() => _db.close();
}
