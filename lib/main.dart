import 'package:flutter/material.dart';

import 'package:capartner/features/auth/account_store.dart';
import 'package:capartner/features/auth/email_screen.dart';
import 'package:capartner/features/auth/login_otp_screen.dart';
import 'package:capartner/features/auth/login_screen.dart';
import 'package:capartner/features/auth/otp_screen.dart';
import 'package:capartner/features/auth/password_screen.dart';
import 'package:capartner/features/home/home_screen.dart';
import 'package:capartner/features/pairing/pairing_screen.dart';
import 'package:capartner/features/splash/splash_screen.dart';
import 'package:capartner/features/welcome/welcome_screen.dart';
import 'package:capartner/theme/app_colors.dart';

void main() {
  runApp(const CAPartnerApp());
}

class CAPartnerApp extends StatefulWidget {
  const CAPartnerApp({super.key});

  @override
  State<CAPartnerApp> createState() => _CAPartnerAppState();
}

class _CAPartnerAppState extends State<CAPartnerApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  final AccountStore _accounts = AccountStore();

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

  void _startSignUp() {
    _push(
      EmailScreen(
        onContinue: (email) => _push(
          OtpScreen(
            onVerify: (_) => _push(
              PasswordScreen(
                onSubmit: (password) {
                  _accounts.register(email, password);
                  _showLogin();
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _startPasswordReset() {
    _push(
      EmailScreen.forgotPassword(
        checkEmail: (email) =>
            _accounts.exists(email) ? null : 'No account found for this email.',
        onContinue: (email) => _push(
          OtpScreen(
            title: 'Forgot Password',
            onVerify: (_) => _push(
              PasswordScreen.forgotPassword(
                onSubmit: (password) {
                  _accounts.updatePassword(email, password);
                  _showLogin();
                },
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showLogin() {
    _replaceAll(
      LoginScreen(onLogin: _logIn, onForgotPassword: _startPasswordReset),
    );
  }

  /// Opens the tabs for the account under [email], which must have a cap.
  void _showHome(String email) {
    // The email can change while the user is logged in, on Edit Profile.
    var currentEmail = email;
    _replaceAll(
      HomeScreen(
        capName: _accounts.pairedCap(email)!,
        profile: _accounts.profile(email),
        onSaveProfile: (profile, newPassword) {
          final rejection = _accounts.updateProfile(
            currentEmail,
            profile,
            newPassword: newPassword,
          );
          if (rejection == null) currentEmail = profile.email;
          return rejection;
        },
        onChangePairing: () => _push(_buildPairing(() => currentEmail)),
        onLogout: _showLogin,
      ),
    );
  }

  /// Pairing that saves the chosen cap to the account and opens the tabs.
  Widget _buildPairing(String Function() email) {
    return PairingScreen(
      onDone: (capName) {
        _accounts.pairCap(email(), capName);
        _showHome(email());
      },
    );
  }

  /// Where a logged-in user lands: a short loading screen, then pairing
  /// until a cap is paired, then the tabs.
  void _enterApp(String email) {
    _replaceAll(
      WelcomeScreen(
        name: _accounts.profile(email).name,
        onDone: () {
          if (_accounts.pairedCap(email) != null) {
            _showHome(email);
          } else {
            _replaceAll(_buildPairing(() => email));
          }
        },
      ),
    );
  }

  String? _logIn(String email, String password, bool rememberMe) {
    if (!_accounts.matches(email, password)) {
      return 'Incorrect email or password.';
    }
    if (_accounts.isVerified(email)) {
      _enterApp(email);
    } else {
      // First login with this account: confirm the email once more.
      _push(
        LoginOtpScreen(
          onVerify: (_) {
            _accounts.markVerified(email);
            _enterApp(email);
          },
        ),
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CAPartner',
      debugShowCheckedModeBanner: false,
      navigatorKey: _navigatorKey,
      theme: ThemeData(
        fontFamily: 'Inter',
        colorScheme: .fromSeed(seedColor: AppColors.darkGreen),
      ),
      home: SplashScreen(onContinue: _startSignUp),
    );
  }
}
