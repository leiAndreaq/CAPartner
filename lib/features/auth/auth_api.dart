import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import 'package:capartner/data/cap_reading.dart';
import 'package:capartner/data/local_database.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/features/camera/recorded_clip.dart';

/// A request the server turned down, or that never reached it. [message] is
/// ready to show to the user.
class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode});

  final String message;

  /// The server's HTTP status; null when it was not reached at all.
  final int? statusCode;

  /// False when the server could not be reached at all, so it said nothing
  /// about the request.
  bool get reachedServer => statusCode != null;

  @override
  String toString() => message;
}

/// A logged-in enforcer: [token] goes with every request that needs a login,
/// until [expiresAt] (Sunday night, Philippine time).
class Session {
  const Session({
    required this.token,
    required this.expiresAt,
    required this.email,
    required this.fullName,
  });

  final String token;
  final DateTime expiresAt;
  final String email;
  final String fullName;
}

/// What the server asks for after a step of logging in.
sealed class LoginStep {
  const LoginStep();
}

/// Logged in; nothing more to do.
class LoggedIn extends LoginStep {
  const LoggedIn(this.session);

  final Session session;
}

/// A new phone: a 6-digit code was emailed, to be sent back with
/// [pendingToken].
class CodeSent extends LoginStep {
  const CodeSent(this.pendingToken);

  final String pendingToken;
}

/// First login: the temporary password from the admin must be replaced,
/// sending [setupToken] with the new one.
class MustChangePassword extends LoginStep {
  const MustChangePassword(this.setupToken);

  final String setupToken;
}

/// The enforcer side of the CAPartner backend: login (`routes/enforcerAuth.js`
/// on the web app's main branch), profile (`enforcerAccount.js`), and the
/// cap's data (`enforcerData.js`).
///
/// The server address comes from `--dart-define=API_URL=...`. The default,
/// localhost, reaches the backend on the PC from a phone plugged in over USB
/// once `adb reverse tcp:3000 tcp:3000` has been run.
class AuthApi {
  AuthApi({http.Client? client, FlutterSecureStorage? storage, String? baseUrl})
    : _client = client ?? http.Client(),
      _storage = storage ?? const FlutterSecureStorage(),
      _baseUrl =
          baseUrl ??
          const String.fromEnvironment(
            'API_URL',
            defaultValue: 'http://localhost:3000',
          );

  final http.Client _client;
  final FlutterSecureStorage _storage;
  final String _baseUrl;

  /// Sending the code email can take the server several seconds.
  static const Duration _timeout = Duration(seconds: 20);

  /// A minute of video can take a while on mobile data.
  static const Duration _uploadTimeout = Duration(minutes: 5);

  static const String _deviceKeyName = 'device_key';
  static const String _tokenName = 'session_token';

  static const String _unreachable =
      "Can't reach the server. Check your connection and try again.";

  String? _deviceKey;

  /// Random key that marks this phone to the server, made on first use and
  /// kept for good. A phone the server knows logs in without a code.
  Future<String> _getDeviceKey() async {
    final known = _deviceKey ?? await _storage.read(key: _deviceKeyName);
    if (known != null) return _deviceKey = known;

    final random = Random.secure();
    final key = [
      for (var i = 0; i < 32; i++)
        random.nextInt(256).toRadixString(16).padLeft(2, '0'),
    ].join();
    await _storage.write(key: _deviceKeyName, value: key);
    return _deviceKey = key;
  }

  /// The login token kept by "Remember me", if any.
  Future<String?> savedToken() => _storage.read(key: _tokenName);

  Future<void> saveToken(String token) =>
      _storage.write(key: _tokenName, value: token);

  Future<void> forgetToken() => _storage.delete(key: _tokenName);

  /// Step 1: email and password. A known phone is logged in at once; a new
  /// one gets a code by email.
  Future<LoginStep> login(String email, String password) async {
    final body = await _post('/enforcer/login', {
      'email': email,
      'password': password,
      'deviceKey': await _getDeviceKey(),
    });
    return body['status'] == 'code_sent'
        ? CodeSent(body['pendingToken'] as String)
        : LoggedIn(_session(body));
  }

  /// Step 2: the emailed code.
  Future<LoginStep> verifyCode(String pendingToken, String code) async {
    final body = await _post('/enforcer/verify-code', {
      'pendingToken': pendingToken,
      'code': code,
    });
    return body['status'] == 'must_change_password'
        ? MustChangePassword(body['setupToken'] as String)
        : LoggedIn(_session(body));
  }

  /// Step 3, first login only: replaces the temporary password.
  Future<Session> setFirstPassword(
    String setupToken,
    String newPassword,
  ) async {
    final body = await _post('/enforcer/change-password', {
      'setupToken': setupToken,
      'newPassword': newPassword,
    });
    return _session(body);
  }

  /// Forgot Password, step 1: emails a code when [email] has an account. The
  /// server answers the same either way; returns the pending token.
  Future<String> startPasswordReset(String email) async {
    final body = await _post('/enforcer/forgot-password/start', {
      'email': email,
      'deviceKey': await _getDeviceKey(),
    });
    return body['pendingToken'] as String;
  }

  /// Forgot Password, step 2: returns the token for setting the password.
  Future<String> verifyPasswordReset(String pendingToken, String code) async {
    final body = await _post('/enforcer/forgot-password/verify', {
      'pendingToken': pendingToken,
      'code': code,
    });
    return body['resetToken'] as String;
  }

  /// Forgot Password, step 3: sets the new password, which also logs in.
  Future<Session> finishPasswordReset(
    String resetToken,
    String newPassword,
  ) async {
    final body = await _post('/enforcer/forgot-password/finish', {
      'resetToken': resetToken,
      'newPassword': newPassword,
    });
    return _session(body);
  }

  /// The logged-in enforcer's details.
  Future<UserProfile> me(String token) async {
    final body = await _send(
      _client.get(_uri('/enforcer/me'), headers: _headers(token)),
    );
    return UserProfile(
      email: body['email'] as String,
      name: body['fullName'] as String? ?? '',
      contactNumber: body['contactNo'] as String? ?? '',
      assignedCap: body['capCode'] as String? ?? '',
    );
  }

  /// Saves the logged-in enforcer's name and contact number; returns them as
  /// the server stored them. The email can only be changed by the admin.
  Future<UserProfile> updateProfile(String token, UserProfile profile) async {
    final body = await _post(
      '/enforcer/me',
      {'fullName': profile.name, 'contactNo': profile.contactNumber},
      token: token,
      method: 'PATCH',
    );
    return UserProfile(
      email: profile.email,
      name: body['fullName'] as String? ?? profile.name,
      contactNumber: body['contactNo'] as String? ?? '',
      assignedCap: profile.assignedCap,
    );
  }

  /// Change Password, step 1: checks [oldPassword] and emails a code;
  /// returns the pending token.
  Future<String> startPasswordChange(
    String token,
    String oldPassword,
    String newPassword,
  ) async {
    final body = await _post('/enforcer/account/change-password/start', {
      'oldPassword': oldPassword,
      'newPassword': newPassword,
    }, token: token);
    return body['pendingToken'] as String;
  }

  /// Change Password, step 2: the emailed code, with the same new password.
  Future<void> confirmPasswordChange(
    String token,
    String pendingToken,
    String code,
    String newPassword,
  ) async {
    await _post('/enforcer/account/change-password/confirm', {
      'pendingToken': pendingToken,
      'code': code,
      'newPassword': newPassword,
    }, token: token);
  }

  /// The admin's vital-sign thresholds.
  Future<VitalThresholds> fetchThresholds(String token) async {
    final body = await _send(
      _client.get(_uri('/enforcer/settings'), headers: _headers(token)),
    );
    return VitalThresholds.fromJson(body);
  }

  /// Sends a batch of cap readings; ones the server already has are skipped
  /// there, so a batch can safely be sent again.
  Future<void> sendReadings(String token, List<CapReading> readings) async {
    await _post('/enforcer/telemetry', {
      'readings': [for (final reading in readings) reading.toJson()],
    }, token: token);
  }

  /// Sends an alert; one the server already has is not saved twice.
  Future<void> sendAlert(String token, AlertRecord alert) async {
    await _post('/enforcer/alerts', alert.toJson(), token: token);
  }

  /// When the admin acknowledged the alert [eventUid], or null while they
  /// have not (or the server does not know it yet). Reads
  /// `GET /enforcer/alerts/:eventUid`, answered with the alert's `status`
  /// ("new", "pending", "acknowledged" or "resolved") and `acknowledgedAt`.
  Future<DateTime?> alertAcknowledgedAt(String token, String eventUid) async {
    final Map<String, dynamic> body;
    try {
      body = await _send(
        _client.get(
          _uri('/enforcer/alerts/$eventUid'),
          headers: _headers(token),
        ),
      );
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
    final status = body['status'];
    if (status != 'acknowledged' && status != 'resolved') return null;
    final at = body['acknowledgedAt'];
    return at is String ? DateTime.parse(at) : DateTime.now().toUtc();
  }

  /// Uploads a camera clip's video file; one the server already has is not
  /// saved twice.
  Future<void> uploadClip(String token, RecordedClip clip) async {
    final file = File(clip.path);
    final uri = _uri('/enforcer/media').replace(
      queryParameters: {
        'eventUid': clip.id,
        'recordedAt': clip.recordedAt.toUtc().toIso8601String(),
        'durationSeconds': '${clip.length.inSeconds}',
      },
    );
    final request = http.StreamedRequest('POST', uri)
      ..headers.addAll({
        'Content-Type': 'video/mp4',
        'Authorization': 'Bearer $token',
      })
      ..contentLength = await file.length();
    file.openRead().listen(
      request.sink.add,
      onDone: request.sink.close,
      onError: request.sink.addError,
    );
    await _send(
      _client.send(request).then(http.Response.fromStream),
      timeout: _uploadTimeout,
    );
  }

  /// Ends the login; the next one on this phone needs a code again.
  Future<void> logout(String token) async {
    await _send(
      _client.post(_uri('/enforcer/logout'), headers: _headers(token)),
    );
  }

  Uri _uri(String path) => Uri.parse('$_baseUrl$path');

  Map<String, String> _headers([String? token]) => {
    'Content-Type': 'application/json',
    'Authorization': ?(token == null ? null : 'Bearer $token'),
  };

  /// Sends [body] as JSON, as the logged-in enforcer when [token] is given.
  Future<Map<String, dynamic>> _post(
    String path,
    Map<String, Object?> body, {
    String? token,
    String method = 'POST',
  }) {
    final request = http.Request(method, _uri(path))
      ..headers.addAll(_headers(token))
      ..body = jsonEncode(body);
    return _send(_client.send(request).then(http.Response.fromStream));
  }

  /// Waits for [request] and returns its JSON body, or throws an
  /// [ApiException] with the server's reason.
  Future<Map<String, dynamic>> _send(
    Future<http.Response> request, {
    Duration timeout = _timeout,
  }) async {
    final http.Response response;
    try {
      response = await request.timeout(timeout);
    } on TimeoutException {
      throw const ApiException(_unreachable);
    } on http.ClientException {
      throw const ApiException(_unreachable);
    }

    Map<String, dynamic> body;
    try {
      body = jsonDecode(response.body) as Map<String, dynamic>;
    } on FormatException {
      body = const {};
    }
    if (response.statusCode >= 400) {
      final error = body['error'] as String? ?? 'Something went wrong.';
      final triesLeft = body['triesLeft'];
      throw ApiException(
        triesLeft is int
            ? '$error $triesLeft ${triesLeft == 1 ? 'try' : 'tries'} left.'
            : error,
        statusCode: response.statusCode,
      );
    }
    return body;
  }

  Session _session(Map<String, dynamic> body) {
    final enforcer = body['enforcer'] as Map<String, dynamic>;
    return Session(
      token: body['token'] as String,
      expiresAt: DateTime.parse(body['expiresAt'] as String),
      email: enforcer['email'] as String,
      fullName: enforcer['fullName'] as String? ?? '',
    );
  }
}
