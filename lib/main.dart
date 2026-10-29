import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';

import 'package:capartner/data/cap_data.dart';
import 'package:capartner/data/local_database.dart';
import 'package:capartner/features/account/edit_profile_screen.dart';
import 'package:capartner/features/auth/account_store.dart';
import 'package:capartner/features/auth/auth_api.dart';
import 'package:capartner/features/auth/email_screen.dart';
import 'package:capartner/features/auth/login_otp_screen.dart';
import 'package:capartner/features/auth/login_screen.dart';
import 'package:capartner/features/auth/otp_screen.dart';
import 'package:capartner/features/auth/password_screen.dart';
import 'package:capartner/features/home/home_screen.dart';
import 'package:capartner/features/map/live_location.dart';
import 'package:capartner/features/pairing/ble_cap_radio.dart';
import 'package:capartner/features/pairing/cap_radio.dart';
import 'package:capartner/features/pairing/pairing_screen.dart';
import 'package:capartner/features/sos/sos_screen.dart';
import 'package:capartner/features/splash/splash_screen.dart';
import 'package:capartner/features/welcome/welcome_screen.dart';
import 'package:capartner/theme/app_colors.dart';

void main() {
  runApp(CAPartnerApp());
}

class CAPartnerApp extends StatefulWidget {
  CAPartnerApp({
    super.key,
    AuthApi? api,
    this.database,
    this.clipsDirectory,
    this.followLocation = true,
    CapRadio? capRadio,
  }) : api = api ?? AuthApi(),
       capRadio = capRadio ?? BleCapRadio();

  final AuthApi api;

  /// The Bluetooth link to the Smart Cap.
  final CapRadio capRadio;

  /// The phone's database; the app's own file when not given.
  final LocalDatabase? database;

  /// Where camera clips are kept; the app's documents folder when not given.
  final Directory? clipsDirectory;

  /// Whether the home screen follows the phone's GPS. Off in tests, which
  /// have no GPS.
  final bool followLocation;

  @override
  State<CAPartnerApp> createState() => _CAPartnerAppState();
}

class _CAPartnerAppState extends State<CAPartnerApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  final AccountStore _accounts = AccountStore();

  AuthApi get _api => widget.api;
  NavigatorState get _navigator => _navigatorKey.currentState!;

  /// Login token of the signed-in enforcer.
  String? _token;

  /// The signed-in enforcer's readings, alerts and clips.
  CapData? _capData;

  LocalDatabase? _openedDatabase;

  Future<LocalDatabase> _database() async =>
      widget.database ?? (_openedDatabase ??= await LocalDatabase.open());

  /// Set on the first tap of the splash screen, so a second does nothing.
  bool _leftSplash = false;

  StreamSubscription<String>? _packets;

  @override
  void initState() {
    super.initState();
    _packets = widget.capRadio.packets.listen(_receivePacket);
  }

  /// Hands a packet from the connected cap to the logged-in enforcer's data.
  Future<void> _receivePacket(String packet) async {
    try {
      await _capData?.receiveJson(packet);
    } on FormatException catch (e) {
      // Not stored; the cap's next packet carries on.
      debugPrint('Cap packet refused: ${e.message}');
    }
  }

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

  /// Runs [request], turning a failure into the message to show.
  Future<String?> _attempt(Future<void> Function() request) async {
    try {
      await request();
      return null;
    } on ApiException catch (e) {
      return e.message;
    }
  }

  /// Picks up a login kept by "Remember me", or else asks for one.
  Future<void> _continueFromSplash() async {
    if (_leftSplash) return;
    _leftSplash = true;
    final token = await _api.savedToken();
    if (token != null) {
      try {
        await _startSession(token, remember: true);
        return;
      } on ApiException catch (e) {
        // Expired or ended by the admin: log in again. Kept when the server
        // is just out of reach, for the next launch.
        if (e.reachedServer) await _api.forgetToken();
      }
    }
    _showLogin();
  }

  /// Forgot Password: email, the emailed code, then a new password, which
  /// also logs in.
  void _startPasswordReset() {
    _push(
      EmailScreen(
        onContinue: (email) => _attempt(() async {
          var pendingToken = await _api.startPasswordReset(email);
          _push(
            OtpScreen(
              email: email,
              onVerify: (code) => _attempt(() async {
                final resetToken = await _api.verifyPasswordReset(
                  pendingToken,
                  code,
                );
                _push(
                  PasswordScreen.forgotPassword(
                    onSubmit: (password) => _attempt(() async {
                      final session = await _api.finishPasswordReset(
                        resetToken,
                        password,
                      );
                      await _startSession(session.token, remember: false);
                    }),
                  ),
                );
              }),
              onResend: () => _attempt(() async {
                pendingToken = await _api.startPasswordReset(email);
              }),
            ),
          );
        }),
      ),
    );
  }

  void _showLogin() {
    _replaceAll(
      LoginScreen(onLogin: _logIn, onForgotPassword: _startPasswordReset),
    );
  }

  /// Opens the tabs for the account under [email], which must have a cap.
  Future<void> _showHome(String email) async {
    final capData = _capData!;
    final clips = await capData.clips();
    final location = widget.followLocation ? LiveLocation() : null;
    _replaceAll(
      HomeScreen(
        capName: _accounts.pairedCap(email)!,
        profile: _accounts.profile(email),
        vitals: capData.vitals,
        alerts: capData.alerts,
        liveLocation: location,
        onSosSent: () => capData.sendSos(
          holdSeconds: SosScreen.holdDuration.inSeconds,
          phonePosition: location?.fix.value?.position,
        ),
        initialClips: clips,
        onSaveClip: capData.saveClip,
        onSaveProfile: (profile, passwordChange) => _attempt(() async {
          final token = _token!;
          final saved = _accounts.profile(email);
          if (profile.name != saved.name ||
              profile.contactNumber != saved.contactNumber) {
            _accounts.saveProfile(await _api.updateProfile(token, profile));
          }
          if (passwordChange != null) {
            await _changePassword(token, email, passwordChange);
          }
        }),
        onChangePairing: () => _push(_buildPairing(email)),
        onLogout: _logOut,
      ),
    );
  }

  /// Change Password from Edit Profile: the server checks the current
  /// password and emails a code, which confirms the change.
  Future<void> _changePassword(
    String token,
    String email,
    PasswordChange change,
  ) async {
    var pendingToken = await _api.startPasswordChange(
      token,
      change.current,
      change.next,
    );
    final changed = await _navigator.push<bool>(
      MaterialPageRoute(
        builder: (context) => OtpScreen(
          title: 'Change Password',
          step: null,
          email: email,
          onVerify: (code) => _attempt(() async {
            await _api.confirmPasswordChange(
              token,
              pendingToken,
              code,
              change.next,
            );
            if (context.mounted) Navigator.of(context).pop(true);
          }),
          onResend: () => _attempt(() async {
            pendingToken = await _api.startPasswordChange(
              token,
              change.current,
              change.next,
            );
          }),
        ),
      ),
    );
    if (changed != true) {
      throw const ApiException('Your password was not changed.');
    }
  }

  /// Pairing that saves the chosen cap to the account and opens the tabs.
  Widget _buildPairing(String email) {
    return PairingScreen(
      radio: widget.capRadio,
      assignedCap: _accounts.profile(email).assignedCap,
      onUnauthorized: (attemptedCap) => _capData?.reportUnauthorizedPairing(
        attemptedCap: attemptedCap,
        assignedCap: _accounts.profile(email).assignedCap,
      ),
      onDone: (capName) {
        _accounts.pairCap(email, capName);
        _showHome(email);
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
            _replaceAll(_buildPairing(email));
          }
        },
      ),
    );
  }

  /// Loads the enforcer behind [token] from the server and lets them in.
  /// With [remember], the token is kept so the next launch skips the login.
  Future<void> _startSession(String token, {required bool remember}) async {
    final profile = await _api.me(token);
    _token = token;
    if (remember) {
      await _api.saveToken(token);
    } else {
      await _api.forgetToken();
    }
    _accounts.signIn(profile);
    _capData?.stop();
    final capData = _capData = CapData(
      database: await _database(),
      api: _api,
      owner: profile.email,
      token: token,
      clipsDirectory: widget.clipsDirectory,
    );
    await capData.start();
    _enterApp(profile.email);
  }

  Future<String?> _logIn(String email, String password, bool rememberMe) {
    return _attempt(() async {
      final step = await _api.login(email, password);
      switch (step) {
        case LoggedIn(:final session):
          await _startSession(session.token, remember: rememberMe);
        case CodeSent(:final pendingToken):
          _askForLoginCode(email, password, pendingToken, rememberMe);
        case MustChangePassword():
          throw StateError('The server skipped the login code.');
      }
    });
  }

  /// A new phone: the code emailed by [_logIn], then on the first login a
  /// new password in place of the admin's temporary one.
  void _askForLoginCode(
    String email,
    String password,
    String pendingToken,
    bool rememberMe,
  ) {
    _push(
      LoginOtpScreen(
        email: email,
        onVerify: (code) => _attempt(() async {
          final step = await _api.verifyCode(pendingToken, code);
          switch (step) {
            case LoggedIn(:final session):
              await _startSession(session.token, remember: rememberMe);
            case MustChangePassword(:final setupToken):
              _push(
                PasswordScreen.firstLogin(
                  onSubmit: (newPassword) => _attempt(() async {
                    final session = await _api.setFirstPassword(
                      setupToken,
                      newPassword,
                    );
                    await _startSession(session.token, remember: rememberMe);
                  }),
                ),
              );
            case CodeSent():
              throw StateError('The server asked for a second code.');
          }
        }),
        // Logging in again is how the server sends a fresh code.
        onResend: () => _attempt(() async {
          final step = await _api.login(email, password);
          if (step is CodeSent) pendingToken = step.pendingToken;
        }),
      ),
    );
  }

  Future<void> _logOut() async {
    final token = _token;
    _token = null;
    _capData?.stop();
    _capData = null;
    unawaited(widget.capRadio.disconnect());
    _showLogin();
    await _api.forgetToken();
    if (token != null) {
      // Already logged out on this phone; the server only forgets it.
      await _attempt(() => _api.logout(token));
    }
  }

  @override
  void dispose() {
    _packets?.cancel();
    widget.capRadio.disconnect();
    _capData?.stop();
    super.dispose();
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
      home: SplashScreen(onContinue: _continueFromSplash),
    );
  }
}
