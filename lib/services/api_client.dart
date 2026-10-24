import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

/// A rejected or failed call to the CAPartner backend.
class ApiException implements Exception {
  const ApiException(this.message, {this.status = 0, this.data = const {}});

  /// Text that can be shown to the user as it is.
  final String message;

  /// HTTP status, or 0 when the server could not be reached.
  final int status;

  /// The whole answer, for extra fields such as `triesLeft`.
  final Map<String, dynamic> data;

  /// The login pass is no longer accepted (Sunday cut-off, force logout,
  /// locked or deleted account). Other 401 answers are about a wrong code.
  bool get isLoggedOut => status == 401 && message == 'Please log in.';

  /// Tries left for a 6-digit code, when the backend says so.
  int? get triesLeft => data['triesLeft'] is int ? data['triesLeft'] as int : null;

  /// The error text with the tries left added, ready to show under the code boxes.
  String get messageWithTries {
    final left = triesLeft;
    if (left == null) return message;
    return '$message $left ${left == 1 ? 'try' : 'tries'} left.';
  }

  @override
  String toString() => message;
}

/// Talks to the CAPartner backend on the station desktop.
///
/// The address can be changed when starting the app:
///   flutter run --dart-define=API_URL=http://192.168.1.10:3000
/// The default 10.0.2.2 is how the Android emulator reaches this computer.
class ApiClient {
  ApiClient({http.Client? client}) : _http = client ?? http.Client();

  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
  static const Duration _timeout = Duration(seconds: 20);

  final http.Client _http;

  Future<Map<String, dynamic>> get(String path, {String? token}) =>
      _send('GET', path, token: token);

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    String? token,
  }) => _send('POST', path, body: body, token: token);

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
    String? token,
  }) => _send('PATCH', path, body: body, token: token);

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    final request = http.Request(method, Uri.parse('$baseUrl$path'))
      ..headers['Content-Type'] = 'application/json';
    if (token != null) request.headers['Authorization'] = 'Bearer $token';
    if (body != null) request.body = jsonEncode(body);

    http.Response response;
    try {
      response = await http.Response.fromStream(
        await _http.send(request).timeout(_timeout),
      );
    } on TimeoutException {
      throw const ApiException('The CAPartner server is taking too long. Please try again.');
    } catch (_) {
      throw const ApiException(
        'Cannot reach the CAPartner server. Check your internet connection.',
      );
    }

    Map<String, dynamic> data = {};
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) data = decoded;
    } catch (_) {
      // Empty or non-JSON answer.
    }

    if (response.statusCode >= 400) {
      throw ApiException(
        data['error'] as String? ?? 'Something went wrong. Please try again.',
        status: response.statusCode,
        data: data,
      );
    }
    return data;
  }
}
