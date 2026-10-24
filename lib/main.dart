import 'package:flutter/material.dart';

import 'package:capartner/features/account/change_password_screen.dart';
import 'package:capartner/features/auth/email_screen.dart';
import 'package:capartner/features/auth/login_otp_screen.dart';
import 'package:capartner/features/auth/login_screen.dart';
import 'package:capartner/features/auth/otp_screen.dart';
import 'package:capartner/features/auth/password_screen.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/features/home/home_screen.dart';
import 'package:capartner/features/pairing/pairing_screen.dart';
import 'package:capartner/features/splash/splash_screen.dart';
import 'package:capartner/features/welcome/welcome_screen.dart';
import 'package:capartner/services/api_client.dart';
import 'package:capartner/services/session_store.dart';
import 'package:capartner/theme/app_colors.dart';

void main() {
  runApp(const CAPartnerApp());
}

/// The enforcer app. Accounts are made by the station admin; the app only logs
/// in. Login rules come from the backend:
///   - first login: temporary password -> email code -> new strong password
///   - new or forgotten phone: password -> email code
///   - same phone after the Sunday 11:59 PM cut-off: password only
class CAPartnerApp extends StatefulWidget {
  const CAPartnerApp({super.key, this.api, this.session});

  /// Replaced in tests.
  final ApiClient? api;
  final SessionStore? session;

  @override
  State<CAPartnerApp> createState() => _CAPartnerAppState();
}

class _CAPartnerAppState extends State<CAPartnerApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  final GlobalKey<ScaffoldMessengerState> _messengerKey =
      GlobalKey<ScaffoldMessengerState>();
  late final ApiClient _api = widget.api ?? ApiClient();
  late final SessionStore _session = widget.session ?? SessionStore();

  /// The login pass while logged in.
  String? _token;

  NavigatorState get _navigator => _navigatorKey.currentState!;

  void _push(Widget screen) {
    _navigator.push(MaterialPageRoute<void>(builder: (_) => screen));
  }

  /// Shows [screen] with nothing behind it to go back to.
  void _replaceAll(Widget screen) {
    _navigator.pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => screen),
      (route) => false,
    );
  }

  void _toast(String message) {
    _messengerKey.currentState
      ?..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  // ---------------------------------------------------------------- start

  /// After the splash: straight in when a login pass is still valid, otherwise Login.
  Future<void> _start() async {
    final token = await _session.token();
    if (token != null) {
      try {
        final me = await _api.get('/enforcer/me', token: token);
        _token = token;
        _enterApp(me);
        return;
      } on ApiException catch (e) {
        if (e.status == 401) {
          await _session.clearLogin();
        } else {
          _toast(e.message);
        }
      }
    }
    _showLogin();
  }

  void _showLogin() {
    _replaceAll(
      LoginScreen(onLogin: _logIn, onForgotPassword: _startPasswordReset),
    );
  }

  // ---------------------------------------------------------------- login

  Future<String?> _logIn(String email, String password, bool rememberMe) async {
    try {
      final result = await _api.post(
        '/enforcer/login',
        body: {
          'email': email,
          'password': password,
          'deviceKey': await _session.deviceKey(),
        },
      );
      if (result['status'] == 'logged_in') {
        await _finishLogin(result);
      } else {
        _askLoginCode(email, password, result['pendingToken'] as String);
      }
      return null;
    } on ApiException catch (e) {
      return e.message;
    }
  }

  /// New or forgotten phone: the 6-digit code from the email.
  void _askLoginCode(String email, String password, String pendingToken) {
    var pending = pendingToken;
    _push(
      LoginOtpScreen(
        onVerify: (code) async {
          try {
            final result = await _api.post(
              '/enforcer/verify-code',
              body: {'pendingToken': pending, 'code': code},
            );
            if (result['status'] == 'must_change_password') {
              _askNewPassword(result['setupToken'] as String);
            } else {
              await _finishLogin(result);
            }
            return null;
          } on ApiException catch (e) {
            return e.messageWithTries;
          }
        },
        // A new code means logging in again with the same email and password.
        onResend: () async {
          try {
            final again = await _api.post(
              '/enforcer/login',
              body: {
                'email': email,
                'password': password,
                'deviceKey': await _session.deviceKey(),
              },
            );
            if (again['pendingToken'] is String) {
              pending = again['pendingToken'] as String;
            }
            return null;
          } on ApiException catch (e) {
            return e.message;
          }
        },
      ),
    );
  }

  /// First login: replace the temporary password with a strong one.
  void _askNewPassword(String setupToken) {
    _push(
      PasswordScreen(
        onSubmit: (password) async {
          try {
            final result = await _api.post(
              '/enforcer/change-password',
              body: {'setupToken': setupToken, 'newPassword': password},
            );
            await _finishLogin(result);
            return null;
          } on ApiException catch (e) {
            return e.message;
          }
        },
      ),
    );
  }

  /// Saves the login pass (valid until Sunday night) and opens the app.
  Future<void> _finishLogin(Map<String, dynamic> result) async {
    final token = result['token'] as String;
    final expiresAt = DateTime.parse(result['expiresAt'] as String).toLocal();
    await _session.saveLogin(token, expiresAt);
    _token = token;
    final me = await _api.get('/enforcer/me', token: token);
    _enterApp(me);
  }

  // ---------------------------------------------------------------- forgot password

  void _startPasswordReset() {
    String? pending;

    Future<String?> sendCode(String email) async {
      try {
        final result = await _api.post(
          '/enforcer/forgot-password/start',
          body: {'email': email, 'deviceKey': await _session.deviceKey()},
        );
        pending = result['pendingToken'] as String?;
        return null;
      } on ApiException catch (e) {
        return e.message;
      }
    }

    String? lastEmail;
    _push(
      EmailScreen.forgotPassword(
        checkEmail: (email) {
          lastEmail = email;
          return sendCode(email);
        },
        onContinue: (email) => _push(
          OtpScreen(
            title: 'Forgot Password',
            onVerify: (code) async {
              try {
                final result = await _api.post(
                  '/enforcer/forgot-password/verify',
                  body: {'pendingToken': pending, 'code': code},
                );
                _askResetPassword(result['resetToken'] as String);
                return null;
              } on ApiException catch (e) {
                return e.messageWithTries;
              }
            },
            onResend: () => sendCode(lastEmail ?? email),
          ),
        ),
      ),
    );
  }

  void _askResetPassword(String resetToken) {
    _push(
      PasswordScreen.forgotPassword(
        onSubmit: (password) async {
          try {
            final result = await _api.post(
              '/enforcer/forgot-password/finish',
              body: {'resetToken': resetToken, 'newPassword': password},
            );
            await _finishLogin(result);
            _toast('Your password was changed.');
            return null;
          } on ApiException catch (e) {
            return e.message;
          }
        },
      ),
    );
  }

  // ---------------------------------------------------------------- logged in

  /// Where a logged-in user lands: a short loading screen, then pairing
  /// until a cap is paired on this phone, then the tabs.
  void _enterApp(Map<String, dynamic> me) {
    final profile = UserProfile(
      email: me['email'] as String? ?? '',
      name: me['fullName'] as String? ?? '',
      contactNumber: me['contactNo'] as String? ?? '',
    );
    final assignedCap = me['capCode'] as String?;
    _replaceAll(
      WelcomeScreen(
        name: profile.name,
        onDone: () async {
          final paired = await _session.pairedCap();
          if (paired != null) {
            _showHome(assignedCap ?? paired, profile);
          } else {
            _replaceAll(_buildPairing(assignedCap, profile));
          }
        },
      ),
    );
  }

  /// Pairing is still a demo (real Bluetooth comes later). It remembers the
  /// chosen cap on this phone.
  Widget _buildPairing(String? assignedCap, UserProfile profile) {
    return PairingScreen(
      onDone: (capName) async {
        await _session.savePairedCap(capName);
        _showHome(assignedCap ?? capName, profile);
      },
    );
  }

  void _showHome(String capName, UserProfile profile) {
    _replaceAll(
      HomeScreen(
        capName: capName,
        profile: profile,
        onSaveProfile: _saveProfile,
        onChangePassword: _startChangePassword,
        onChangePairing: () => _push(_buildPairing(null, profile)),
        onLogout: _logout,
      ),
    );
  }

  /// The login pass ended (Sunday cut-off, force logout, deleted account).
  Future<void> _sessionEnded() async {
    await _session.clearLogin();
    _token = null;
    _showLogin();
    _toast('Your login ended. Please log in again.');
  }

  Future<String?> _saveProfile(UserProfile profile) async {
    try {
      await _api.patch(
        '/enforcer/me',
        body: {'fullName': profile.name, 'contactNo': profile.contactNumber},
        token: _token,
      );
      _toast('Profile saved.');
      return null;
    } on ApiException catch (e) {
      if (e.isLoggedOut) {
        await _sessionEnded();
        return null;
      }
      return e.message;
    }
  }

  void _startChangePassword() {
    _push(
      ChangePasswordScreen(
        onSubmit: (currentPassword, newPassword) async {
          Future<Map<String, dynamic>> start() => _api.post(
            '/enforcer/account/change-password/start',
            body: {'oldPassword': currentPassword, 'newPassword': newPassword},
            token: _token,
          );
          try {
            var pending = (await start())['pendingToken'] as String;
            _push(
              OtpScreen(
                title: 'Change Password',
                onVerify: (code) async {
                  try {
                    await _api.post(
                      '/enforcer/account/change-password/confirm',
                      body: {
                        'pendingToken': pending,
                        'code': code,
                        'newPassword': newPassword,
                      },
                      token: _token,
                    );
                    // Back to Edit Profile (close the code and password screens).
                    _navigator
                      ..pop()
                      ..pop();
                    _toast('Your password was changed.');
                    return null;
                  } on ApiException catch (e) {
                    if (e.isLoggedOut) {
                      await _sessionEnded();
                      return null;
                    }
                    return e.messageWithTries;
                  }
                },
                onResend: () async {
                  try {
                    pending = (await start())['pendingToken'] as String;
                    return null;
                  } on ApiException catch (e) {
                    if (e.isLoggedOut || e.status == 423) {
                      await _sessionEnded();
                      return null;
                    }
                    return e.message;
                  }
                },
              ),
            );
            return null;
          } on ApiException catch (e) {
            if (e.isLoggedOut || e.status == 423) {
              await _sessionEnded();
              return null;
            }
            return e.message;
          }
        },
      ),
    );
  }

  /// Logout forgets this phone on the server: the next login needs a code again.
  Future<void> _logout() async {
    try {
      await _api.post('/enforcer/logout', token: _token);
    } on ApiException {
      // Offline or already logged out: forget the pass on the phone anyway.
    }
    await _session.clearLogin();
    _token = null;
    _showLogin();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CAPartner',
      debugShowCheckedModeBanner: false,
      navigatorKey: _navigatorKey,
      scaffoldMessengerKey: _messengerKey,
      theme: ThemeData(
        fontFamily: 'Inter',
        colorScheme: .fromSeed(seedColor: AppColors.darkGreen),
      ),
      home: SplashScreen(onContinue: _start),
    );
  }
}
