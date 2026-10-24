import 'package:capartner/services/api_client.dart';
import 'package:capartner/services/session_store.dart';

/// A stand-in for the CAPartner backend, following the same rules as the real
/// one (see backend/routes/enforcerAuth.js) for one enforcer account.
class FakeBackend extends ApiClient {
  FakeBackend({
    this.email = 'juan@gmail.com',
    this.tempPassword = 'TempPass#123',
  });

  final String email;
  final String tempPassword;
  static const String goodCode = '123456';

  String? password;
  bool mustChangePassword = true;
  String? registeredDevice;
  String fullName = 'Juan Dela Cruz';
  String? contactNo;
  final List<String> calls = [];

  bool get _isLoggedIn => registeredDevice != null;

  Map<String, dynamic> _loggedIn() => {
    'status': 'logged_in',
    'token': 'token-for-$registeredDevice',
    'expiresAt': DateTime.now().add(const Duration(days: 2)).toIso8601String(),
  };

  Never _fail(int status, String error, [Map<String, dynamic> extra = const {}]) =>
      throw ApiException(error, status: status, data: {'error': error, ...extra});

  void _checkCode(Object? code) {
    if (code != goodCode) _fail(401, 'Wrong code.', {'triesLeft': 4});
  }

  void _checkToken(String? token) {
    if (!_isLoggedIn || token != 'token-for-$registeredDevice') {
      _fail(401, 'Please log in.');
    }
  }

  @override
  Future<Map<String, dynamic>> get(String path, {String? token}) async {
    calls.add('GET $path');
    if (path == '/enforcer/me') {
      _checkToken(token);
      return {
        'email': email,
        'fullName': fullName,
        'contactNo': contactNo,
        'capCode': 'CAP-001',
        'sector': 'Sector 6 - Zapote',
      };
    }
    _fail(404, 'Not found.');
  }

  @override
  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    calls.add('PATCH $path');
    _checkToken(token);
    fullName = body!['fullName'] as String;
    final contact = (body['contactNo'] as String).replaceAll(RegExp(r'[\s-]'), '');
    contactNo = contact.isEmpty ? null : contact;
    return {'message': 'Profile saved.'};
  }

  @override
  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    calls.add('POST $path');
    final b = body ?? const {};
    switch (path) {
      case '/enforcer/login':
        final emailOk = (b['email'] as String).toLowerCase() == email;
        final current = mustChangePassword ? tempPassword : password;
        if (!emailOk || b['password'] != current) {
          _fail(401, 'Invalid email or password.');
        }
        if (!mustChangePassword && registeredDevice == b['deviceKey']) {
          return _loggedIn();
        }
        return {'status': 'code_sent', 'pendingToken': 'pending:${b['deviceKey']}'};
      case '/enforcer/verify-code':
        _checkCode(b['code']);
        final device = (b['pendingToken'] as String).split(':').last;
        if (mustChangePassword) {
          return {'status': 'must_change_password', 'setupToken': 'setup:$device'};
        }
        registeredDevice = device;
        return _loggedIn();
      case '/enforcer/change-password':
        if (b['newPassword'] == tempPassword) {
          _fail(400, 'New password must be different from the temporary one.');
        }
        password = b['newPassword'] as String;
        mustChangePassword = false;
        registeredDevice = (b['setupToken'] as String).split(':').last;
        return _loggedIn();
      case '/enforcer/logout':
        _checkToken(token);
        registeredDevice = null;
        return {'message': 'Logged out.'};
      case '/enforcer/forgot-password/start':
        return {'message': 'If this email has an account, a code was sent.', 'pendingToken': 'reset:${b['deviceKey']}'};
      case '/enforcer/forgot-password/verify':
        _checkCode(b['code']);
        return {'status': 'set_new_password', 'resetToken': 'ok:${(b['pendingToken'] as String).split(':').last}'};
      case '/enforcer/forgot-password/finish':
        if (b['newPassword'] == password) {
          _fail(400, 'New password must be different from the old one.');
        }
        password = b['newPassword'] as String;
        mustChangePassword = false;
        registeredDevice = (b['resetToken'] as String).split(':').last;
        return _loggedIn();
      case '/enforcer/account/change-password/start':
        _checkToken(token);
        if (b['oldPassword'] != password) _fail(401, 'Current password is wrong.');
        return {'pendingToken': 'change'};
      case '/enforcer/account/change-password/confirm':
        _checkToken(token);
        _checkCode(b['code']);
        password = b['newPassword'] as String;
        return {'message': 'Your password was changed.'};
    }
    _fail(404, 'Not found.');
  }
}

/// Keeps the session in memory instead of the phone's secure storage.
class FakeSession extends SessionStore {
  String? _token;
  DateTime? _expiresAt;
  String? _pairedCap;

  @override
  Future<String> deviceKey() async => 'test-phone-key-0123456789abcdef0123456789';

  @override
  Future<void> saveLogin(String token, DateTime expiresAt) async {
    _token = token;
    _expiresAt = expiresAt;
  }

  @override
  Future<String?> token() async {
    final expires = _expiresAt;
    if (expires == null || expires.isBefore(DateTime.now())) return null;
    return _token;
  }

  @override
  Future<void> clearLogin() async {
    _token = null;
    _expiresAt = null;
  }

  @override
  Future<String?> pairedCap() async => _pairedCap;

  @override
  Future<void> savePairedCap(String capName) async => _pairedCap = capName;
}
