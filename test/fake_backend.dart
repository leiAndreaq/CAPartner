import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:path/path.dart' as p;
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'package:capartner/data/local_database.dart';
import 'package:capartner/features/auth/auth_api.dart';

/// Stands in for the enforcer routes of the CAPartner backend, with one
/// account, user@gmail.com, made by the admin with [password] as its
/// temporary password. Every emailed code is [code].
class FakeBackend {
  String password = 'Temp#Pass123';
  bool mustChangePassword = true;
  String fullName = 'Juan Dela Cruz';
  String? contactNumber;

  /// The cap the admin assigned to this account.
  String? capCode = 'CAP-001';

  static const String code = '123456';

  /// The phone the server remembers, which logs in without a code.
  String? knownDevice;

  /// The phone the last code was sent for.
  String? _codeDevice;

  int codesSent = 0;

  /// When false, every request fails as if the phone had no signal.
  bool online = true;

  /// Whether the admin has assigned the account a cap; readings are refused
  /// without one.
  bool capAssigned = true;

  /// The admin's thresholds.
  Map<String, Object> settings = {
    'heartRateMaxBpm': 120,
    'bodyTempMaxC': 38.0,
    'lowBatteryPct': 20,
  };

  /// What the phone sent, as the server saved it.
  final List<Map<String, dynamic>> readings = [];
  final List<Map<String, dynamic>> alerts = [];

  /// Event ids of the alerts the admin has acknowledged.
  final Set<String> acknowledged = {};

  /// Uploaded clips' sizes in bytes, by event UID.
  final Map<String, int> clips = {};

  AuthApi api() =>
      AuthApi(client: MockClient(_handle), baseUrl: 'http://backend.test');

  static const Map<String, Object> _loggedIn = {
    'status': 'logged_in',
    'token': 'token-1',
    'expiresAt': '2026-11-01T15:59:59.000Z',
    'enforcer': {
      'id': 'e1',
      'email': 'user@gmail.com',
      'fullName': 'Juan Dela Cruz',
    },
  };

  Future<http.Response> _handle(http.Request request) async {
    if (!online) throw http.ClientException('No signal.');
    http.Response reply(Object json, [int status = 200]) =>
        http.Response(jsonEncode(json), status);

    if (request.url.path == '/enforcer/media') {
      final eventUid = request.url.queryParameters['eventUid']!;
      clips[eventUid] = request.bodyBytes.length;
      return reply({'id': clips.length, 'status': 'created'});
    }

    if (request.url.path.startsWith('/enforcer/alerts/')) {
      final eventUid = request.url.pathSegments.last;
      if (!alerts.any((a) => a['eventUid'] == eventUid)) {
        return reply({'error': 'Not found.'}, 404);
      }
      return reply({
        'status': acknowledged.contains(eventUid) ? 'acknowledged' : 'new',
        'acknowledgedAt': acknowledged.contains(eventUid)
            ? '2026-10-29T08:00:00.000Z'
            : null,
      });
    }

    final body = request.body.isEmpty
        ? const <String, dynamic>{}
        : jsonDecode(request.body) as Map<String, dynamic>;

    switch (request.url.path) {
      case '/enforcer/login':
        if (body['email'] != 'user@gmail.com' || body['password'] != password) {
          return reply({'error': 'Invalid email or password.'}, 401);
        }
        if (!mustChangePassword && body['deviceKey'] == knownDevice) {
          return reply(_loggedIn);
        }
        codesSent++;
        _codeDevice = body['deviceKey'] as String;
        return reply({'status': 'code_sent', 'pendingToken': 'pending'});
      case '/enforcer/verify-code':
        if (body['code'] != code) {
          return reply({'error': 'Wrong code.', 'triesLeft': 4}, 401);
        }
        if (mustChangePassword) {
          return reply({
            'status': 'must_change_password',
            'setupToken': 'setup',
          });
        }
        knownDevice = _codeDevice;
        return reply(_loggedIn);
      case '/enforcer/change-password':
        password = body['newPassword'] as String;
        mustChangePassword = false;
        knownDevice = _codeDevice;
        return reply(_loggedIn);
      case '/enforcer/forgot-password/start':
        codesSent++;
        _codeDevice = body['deviceKey'] as String;
        return reply({'pendingToken': 'reset-pending'});
      case '/enforcer/forgot-password/verify':
        if (body['code'] != code) {
          return reply({'error': 'Wrong code.', 'triesLeft': 4}, 401);
        }
        return reply({'status': 'set_new_password', 'resetToken': 'reset'});
      case '/enforcer/forgot-password/finish':
        password = body['newPassword'] as String;
        mustChangePassword = false;
        knownDevice = _codeDevice;
        return reply(_loggedIn);
      case '/enforcer/me' when request.method == 'PATCH':
        fullName = body['fullName'] as String;
        final contactNo = (body['contactNo'] as String).replaceAll(' ', '');
        contactNumber = contactNo.isEmpty ? null : contactNo;
        return reply({'fullName': fullName, 'contactNo': contactNumber});
      case '/enforcer/me':
        return reply({
          'id': 'e1',
          'email': 'user@gmail.com',
          'fullName': fullName,
          'contactNo': contactNumber,
          'capCode': capCode,
        });
      case '/enforcer/account/change-password/start':
        if (body['oldPassword'] != password) {
          return reply({'error': 'Current password is wrong.'}, 401);
        }
        codesSent++;
        return reply({'pendingToken': 'change-pending'});
      case '/enforcer/account/change-password/confirm':
        if (body['code'] != code) {
          return reply({'error': 'Wrong code.', 'triesLeft': 4}, 401);
        }
        password = body['newPassword'] as String;
        return reply({'message': 'Your password was changed.'});
      case '/enforcer/logout':
        knownDevice = null;
        return reply({'message': 'Logged out.'});
      case '/enforcer/settings':
        return reply(settings);
      case '/enforcer/telemetry':
        if (!capAssigned) {
          return reply({'error': 'No cap is assigned to you yet.'}, 409);
        }
        final sent = (body['readings'] as List).cast<Map<String, dynamic>>();
        if (sent.any((r) => r['recordedAt'] == null)) {
          return reply({'error': 'recordedAt is required.'}, 400);
        }
        final known = {for (final r in readings) r['recordedAt']};
        readings.addAll(sent.where((r) => !known.contains(r['recordedAt'])));
        return reply({'received': sent.length});
      case '/enforcer/alerts':
        if (!alerts.any((a) => a['eventUid'] == body['eventUid'])) {
          alerts.add(body);
        }
        return reply({'id': alerts.length, 'status': 'created'});
    }
    return reply({'error': 'Not found.'}, 404);
  }
}

var _databases = 0;

/// A fresh database in a temporary folder, run in the test's own isolate so
/// it works inside `testWidgets`.
Future<LocalDatabase> testDatabase() async {
  sqfliteFfiInit();
  final folder = Directory.systemTemp.createTempSync('capartner_test');
  return LocalDatabase.open(
    path: p.join(folder.path, 'test_${_databases++}.db'),
    factory: databaseFactoryFfiNoIsolate,
  );
}
