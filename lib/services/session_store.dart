import 'dart:math';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// What the phone remembers between app starts, kept in the phone's secure
/// storage (encrypted by Android), never in plain files.
///
/// - The phone key: made once, so the backend can recognise this phone and skip
///   the email code on the next login. Only its scramble is stored on the server.
/// - The login pass: lets the enforcer stay logged in until Sunday 11:59 PM.
/// - The paired cap name (pairing is still a demo).
class SessionStore {
  SessionStore({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  final FlutterSecureStorage _storage;

  static const String _deviceKeyKey = 'device_key';
  static const String _tokenKey = 'login_token';
  static const String _expiresAtKey = 'login_expires_at';
  static const String _pairedCapKey = 'paired_cap';

  /// This phone's secret key. Made on first use and kept until the app is removed.
  Future<String> deviceKey() async {
    final existing = await _storage.read(key: _deviceKeyKey);
    if (existing != null && existing.length >= 32) return existing;

    final random = Random.secure();
    final key = List.generate(32, (_) => random.nextInt(256))
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join();
    await _storage.write(key: _deviceKeyKey, value: key);
    return key;
  }

  Future<void> saveLogin(String token, DateTime expiresAt) async {
    await _storage.write(key: _tokenKey, value: token);
    await _storage.write(key: _expiresAtKey, value: expiresAt.toIso8601String());
  }

  /// The saved login pass, or null when there is none or its time is over.
  Future<String?> token() async {
    final token = await _storage.read(key: _tokenKey);
    final expires = DateTime.tryParse(await _storage.read(key: _expiresAtKey) ?? '');
    if (token == null || expires == null || expires.isBefore(DateTime.now())) {
      return null;
    }
    return token;
  }

  /// Forgets the login pass. The phone key stays, so the phone is still known.
  Future<void> clearLogin() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _expiresAtKey);
  }

  Future<String?> pairedCap() => _storage.read(key: _pairedCapKey);

  Future<void> savePairedCap(String capName) =>
      _storage.write(key: _pairedCapKey, value: capName);
}
