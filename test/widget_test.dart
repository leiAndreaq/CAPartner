import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:capartner/features/welcome/welcome_screen.dart';
import 'package:capartner/main.dart';
import 'package:capartner/features/home/home_screen.dart';
import 'package:capartner/features/account/change_password_screen.dart';
import 'package:capartner/features/account/edit_profile_screen.dart';
import 'package:capartner/features/account/privacy_policy_screen.dart';
import 'package:capartner/features/alerts/alerts_tab.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/features/auth/email_screen.dart';
import 'package:capartner/features/auth/login_otp_screen.dart';
import 'package:capartner/features/auth/login_screen.dart';
import 'package:capartner/features/auth/otp_screen.dart';
import 'package:capartner/features/pairing/pairing_screen.dart';
import 'package:capartner/features/splash/splash_screen.dart';
import 'package:capartner/features/auth/password_screen.dart';
import 'package:capartner/features/auth/utils/email_validator.dart';
import 'package:capartner/features/auth/utils/password_validator.dart';

import 'fake_backend.dart';

void main() {
  testWidgets('App starts on the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(const CAPartnerApp());

    expect(find.byType(SplashScreen), findsOneWidget);
    expect(find.text('CAPartner'), findsOneWidget);
    expect(
      find.text('CAPartner sa Kalusugan, CAPartner sa Kaligtasan.'),
      findsOneWidget,
    );
    expect(find.bySemanticsLabel('CAPartner logo'), findsOneWidget);
  });

  testWidgets('Tapping the splash screen calls onContinue', (
    WidgetTester tester,
  ) async {
    var continued = false;
    await tester.pumpWidget(
      MaterialApp(home: SplashScreen(onContinue: () => continued = true)),
    );

    await tester.tap(find.byType(SplashScreen));

    expect(continued, isTrue);
  });

  testWidgets('Tapping the splash screen opens Login (no sign-up)', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      CAPartnerApp(api: FakeBackend(), session: FakeSession()),
    );

    await tester.tap(find.byType(SplashScreen));
    await tester.pumpAndSettle();

    // Accounts are made by the admin, so the app goes straight to Login.
    expect(find.byType(LoginScreen), findsOneWidget);
    expect(find.byType(EmailScreen), findsNothing);
  });

  testWidgets('Continue is enabled only for a valid email', (
    WidgetTester tester,
  ) async {
    // The default 800x600 test surface leaves the button below the fold.
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    String? submitted;
    await tester.pumpWidget(
      MaterialApp(home: EmailScreen(onContinue: (email) => submitted = email)),
    );

    await tester.tap(find.text('Continue'));
    expect(submitted, isNull);

    await tester.enterText(find.byType(TextField), 'user@gmail.com');
    await tester.pump();
    await tester.tap(find.text('Continue'));

    expect(submitted, 'user@gmail.com');
  });

  test('validateEmail accepts valid addresses', () {
    for (final email in [
      'user@gmail.com',
      '  user@gmail.com  ',
      'first.last+tag@yahoo.com',
      'u_1@GMAIL.com',
      'officer@gov.com',
      'officer@dilg.gov.ph',
    ]) {
      expect(validateEmail(email), isNull, reason: email);
    }
  });

  test('validateEmail rejects unsupported domains', () {
    for (final email in [
      'user@example.com',
      'user@my-domain.io',
      'user@notgmail.com.ph',
      'user@fakegov.ph',
    ]) {
      expect(
        validateEmail(email),
        'Use an email like @gmail.com or @yahoo.com.',
        reason: email,
      );
    }
  });

  test('validateEmail explains what is wrong', () {
    expect(validateEmail(''), 'Please enter your email address.');
    expect(validateEmail('   '), 'Please enter your email address.');
    expect(validateEmail('user'), 'Email address must include "@".');
    expect(validateEmail('a@b@c.com'), 'Email address can only have one "@".');
    expect(validateEmail('@example.com'), 'Enter the name before "@".');
    expect(
      validateEmail('user@'),
      'Enter the domain after "@", e.g. gmail.com.',
    );
    expect(
      validateEmail('user@gmail'),
      'Enter a complete domain, e.g. gmail.com.',
    );
    expect(
      validateEmail('${'a' * 65}@example.com'),
      'Email address is too long.',
    );
    for (final email in [
      'us er@example.com',
      '.user@gmail.com',
      'user.@example.com',
      'us..er@example.com',
      'user@example..com',
      'user@-example.com',
      'user@example.c',
      'user@example.123',
      'user@.com',
      'user@example.',
    ]) {
      expect(
        validateEmail(email),
        'Please enter a valid email address.',
        reason: email,
      );
    }
  });

  testWidgets('Email errors appear on Continue and update while typing', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    String? submitted;
    await tester.pumpWidget(
      MaterialApp(home: EmailScreen(onContinue: (email) => submitted = email)),
    );

    await tester.enterText(find.byType(TextField), 'user');
    await tester.pump();
    expect(find.text('Email address must include "@".'), findsNothing);

    await tester.tap(find.text('Continue'));
    await tester.pump();
    expect(find.text('Email address must include "@".'), findsOneWidget);
    expect(submitted, isNull);

    await tester.enterText(find.byType(TextField), 'user@gmail');
    await tester.pump();
    expect(
      find.text('Enter a complete domain, e.g. gmail.com.'),
      findsOneWidget,
    );

    await tester.enterText(find.byType(TextField), ' user@gmail.com ');
    await tester.pump();
    expect(find.textContaining('domain'), findsNothing);
    expect(find.bySemanticsLabel('Valid email'), findsOneWidget);

    await tester.tap(find.text('Continue'));
    expect(submitted, 'user@gmail.com');
  });

  testWidgets('Forgot Password accepts any email domain and opens the OTP screen', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final sent = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (context) => EmailScreen.forgotPassword(
            checkEmail: (email) async {
              sent.add(email);
              return null;
            },
            onContinue: (_) => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const OtpScreen()),
            ),
          ),
        ),
      ),
    );

    // The admin may have used a work email, so no provider list here.
    await tester.enterText(find.byType(TextField), 'officer@caloocan.city');
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(sent, ['officer@caloocan.city']);
    expect(find.byType(OtpScreen), findsOneWidget);
    expect(find.text('Verify Your Email'), findsOneWidget);
  });

  testWidgets('OTP shows the backend answer under the boxes', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        home: OtpScreen(
          onVerify: (code) async => 'Wrong code. 4 tries left.',
        ),
      ),
    );

    await tester.enterText(find.byType(TextField), '000000');
    await tester.pump();
    await tester.tap(find.text('Verify'));
    await tester.pumpAndSettle();

    expect(find.text('Wrong code. 4 tries left.'), findsOneWidget);
    // The boxes are cleared for the next try, and typing hides the message.
    expect(
      tester.widget<TextField>(find.byType(TextField)).controller!.text,
      '',
    );
    await tester.enterText(find.byType(TextField), '1');
    await tester.pump();
    expect(find.text('Wrong code. 4 tries left.'), findsNothing);
  });

  testWidgets('OTP accepts only a full 6-digit code', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    String? verified;
    await tester.pumpWidget(
      MaterialApp(
        home: OtpScreen(
          onVerify: (code) async {
            verified = code;
            return null;
          },
        ),
      ),
    );

    await tester.tap(find.text('Verify'));
    await tester.pump();
    expect(find.text('Please enter the 6-digit code.'), findsOneWidget);

    await tester.enterText(find.byType(TextField), '12a3');
    await tester.pump();
    expect(find.text('The code must be 6 digits.'), findsOneWidget);
    await tester.tap(find.text('Verify'));
    expect(verified, isNull);

    await tester.enterText(find.byType(TextField), '1234567');
    await tester.pump();
    expect(find.text('The code must be 6 digits.'), findsNothing);
    await tester.tap(find.text('Verify'));
    expect(verified, '123456');
  });

  testWidgets('Resend OTP clears the code and starts a cooldown', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    var resent = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: OtpScreen(
          onResend: () async {
            resent++;
            return null;
          },
        ),
      ),
    );

    await tester.enterText(find.byType(TextField), '123');
    await tester.tap(find.text('Resend OTP'));
    await tester.pump();

    expect(resent, 1);
    expect(
      tester.widget<TextField>(find.byType(TextField)).controller!.text,
      '',
    );
    expect(find.text('Resend OTP in 30s'), findsOneWidget);

    await tester.pump(const Duration(seconds: 30));
    expect(find.text('Resend OTP'), findsOneWidget);
  });

  test('validatePassword follows the backend rule (10+, upper, lower, number, symbol)', () {
    expect(validatePassword(''), 'Please enter a password.');
    expect(validatePassword('Abcdef1!'), 'Use at least 10 characters.');
    expect(
      validatePassword('abcdefgh1!'),
      'Add at least one uppercase letter (A-Z).',
    );
    expect(
      validatePassword('ABCDEFGH1!'),
      'Add at least one lowercase letter (a-z).',
    );
    expect(validatePassword('Abcdefghi!'), 'Add at least one number (0-9).');
    expect(
      validatePassword('Abcdefghi1'),
      'Add at least one special character, e.g. ! @ # \$.',
    );
    expect(validatePassword('Abcdefgh1!'), isNull);
  });

  testWidgets('Create Password accepts only a strong, matching password', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    String? created;
    await tester.pumpWidget(
      MaterialApp(
        home: PasswordScreen(
          onSubmit: (p) async {
            if (p == 'Rejected#123') return 'New password must be different.';
            created = p;
            return null;
          },
        ),
      ),
    );

    await tester.tap(find.text('Create Password'));
    await tester.pump();
    expect(find.text('Please enter a password.'), findsOneWidget);
    expect(find.text('Please confirm your password.'), findsOneWidget);

    await tester.enterText(find.byType(TextField).first, 'abcdefgh1!');
    await tester.pump();
    expect(
      find.text('Add at least one uppercase letter (A-Z).'),
      findsOneWidget,
    );

    await tester.enterText(find.byType(TextField).first, 'Abcdefgh1!');
    await tester.enterText(find.byType(TextField).last, 'Abcdefgh1');
    await tester.pump();
    expect(find.text('Passwords do not match.'), findsOneWidget);
    await tester.tap(find.text('Create Password'));
    expect(created, isNull);

    // The backend's answer is shown under the password.
    await tester.enterText(find.byType(TextField).first, 'Rejected#123');
    await tester.enterText(find.byType(TextField).last, 'Rejected#123');
    await tester.pump();
    await tester.tap(find.text('Create Password'));
    await tester.pumpAndSettle();
    expect(find.text('New password must be different.'), findsOneWidget);

    await tester.enterText(find.byType(TextField).first, 'Abcdefgh1!');
    await tester.enterText(find.byType(TextField).last, 'Abcdefgh1!');
    await tester.pump();
    await tester.tap(find.text('Create Password'));
    await tester.pumpAndSettle();
    expect(created, 'Abcdefgh1!');
  });

  testWidgets('Login asks for both fields and shows a rejected login', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final attempts = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        home: LoginScreen(
          onLogin: (identifier, password, rememberMe) async {
            attempts.add('$identifier/$password/$rememberMe');
            return password == 'Abcdef1!' ? null : 'Incorrect password.';
          },
        ),
      ),
    );

    await tester.tap(find.text('Continue'));
    await tester.pump();
    expect(find.text('Please enter your email.'), findsOneWidget);
    expect(find.text('Please enter your password.'), findsOneWidget);
    expect(attempts, isEmpty);

    await tester.enterText(find.byType(TextField).first, 'user@gmail.com');
    await tester.enterText(find.byType(TextField).last, 'wrong');
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pump();
    expect(find.text('Incorrect password.'), findsOneWidget);

    await tester.tap(find.text('Remember me'));
    await tester.enterText(find.byType(TextField).last, 'Abcdef1!');
    await tester.pump();
    expect(find.text('Incorrect password.'), findsNothing);
    await tester.tap(find.text('Continue'));
    expect(attempts, [
      'user@gmail.com/wrong/true',
      'user@gmail.com/Abcdef1!/false',
    ]);
  });

  testWidgets('Enforcer journey: first login, logout, forgot password', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final backend = FakeBackend();
    final session = FakeSession();
    final verifyButton = find.widgetWithText(FilledButton, 'Verify');

    Future<void> logOut() async {
      await tester.tap(find.text('Account'));
      await tester.pump();
      await tester.ensureVisible(find.text('Log out'));
      await tester.tap(find.text('Log out'));
      await tester.pumpAndSettle();
      // Confirm in the dialog.
      await tester.tap(find.text('Log out').last);
      await tester.pumpAndSettle();
    }

    Future<void> logIn(String password) async {
      await tester.enterText(find.byType(TextField).first, 'Juan@Gmail.com');
      await tester.enterText(find.byType(TextField).last, password);
      await tester.pump();
      await tester.tap(find.text('Continue'));
      await tester.pumpAndSettle();
    }

    Future<void> enterCode(String code) async {
      await tester.enterText(find.byType(TextField), code);
      await tester.pump();
      await tester.tap(verifyButton);
      await tester.pumpAndSettle();
    }

    Future<void> setPassword(String password, String button) async {
      await tester.enterText(find.byType(TextField).first, password);
      await tester.enterText(find.byType(TextField).last, password);
      await tester.pump();
      await tester.tap(find.text(button));
      await tester.pump();
    }

    await tester.pumpWidget(CAPartnerApp(api: backend, session: session));
    await tester.tap(find.byType(SplashScreen));
    await tester.pumpAndSettle();
    expect(find.byType(LoginScreen), findsOneWidget);

    await logIn('Wrong#12345');
    expect(find.text('Invalid email or password.'), findsOneWidget);

    // First login: temporary password from the admin's email, then the code.
    await logIn('TempPass#123');
    expect(find.byType(LoginOtpScreen), findsOneWidget);
    await enterCode('000000');
    expect(find.text('Wrong code. 4 tries left.'), findsOneWidget);
    await enterCode(FakeBackend.goodCode);

    // Then a new strong password is required.
    expect(find.byType(PasswordScreen), findsOneWidget);
    await setPassword('Traffic#2026', 'Create Password');

    // The loading screen moves on by itself.
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(WelcomeScreen), findsOneWidget);
    await tester.pumpAndSettle();
    expect(find.byType(PairingScreen), findsOneWidget);

    // Pairing; the scan animates forever, so settle is not usable there.
    await tester.tap(find.text('Start Scanning'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Turn on Bluetooth'));
    await tester.pump(const Duration(seconds: 3));
    await tester.tap(find.text('CAP-001'));
    await tester.pump();
    await tester.tap(find.text('Pair Device'));
    await tester.pump(const Duration(seconds: 2));
    await tester.tap(find.text('Go To Dashboard'));
    await tester.pumpAndSettle();
    expect(find.byType(HomeScreen), findsOneWidget);
    expect(find.text('CAP 001 - PSTMD-2026-084'), findsOneWidget);
    expect(backend.registeredDevice, isNotNull);

    // Logout forgets this phone on the server: the next login needs a code
    // again, but no pairing (the cap is remembered on this phone).
    await logOut();
    expect(backend.registeredDevice, isNull);
    expect(await session.token(), isNull);
    await logIn('Traffic#2026');
    expect(find.byType(LoginOtpScreen), findsOneWidget);
    await enterCode(FakeBackend.goodCode);
    await tester.pumpAndSettle();
    expect(find.byType(HomeScreen), findsOneWidget);

    // Closing and opening the app keeps the login (until Sunday night).
    await tester.pumpWidget(const SizedBox());
    await tester.pumpWidget(CAPartnerApp(api: backend, session: session));
    await tester.tap(find.byType(SplashScreen));
    await tester.pumpAndSettle();
    expect(find.byType(HomeScreen), findsOneWidget);

    // Forgot password: email -> code -> new password -> straight in.
    await logOut();
    await tester.tap(find.text('Forgot Password?'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), 'juan@gmail.com');
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await enterCode(FakeBackend.goodCode);
    expect(find.byType(PasswordScreen), findsOneWidget);
    await setPassword('Traffic#2026', 'Update Password');
    await tester.pumpAndSettle();
    expect(
      find.text('New password must be different from the old one.'),
      findsOneWidget,
    );
    await setPassword('Newpass#2026', 'Update Password');
    await tester.pumpAndSettle();
    expect(find.byType(HomeScreen), findsOneWidget);
    expect(backend.password, 'Newpass#2026');
  });

  testWidgets('Dashboard shows the readings and switches tabs', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const MaterialApp(home: HomeScreen(capName: 'CAP-014')),
    );

    expect(find.text('CAP 014 - PSTMD-2026-084'), findsOneWidget);
    expect(find.text('DASHBOARD'), findsOneWidget);
    expect(find.text('Heart Rate'), findsOneWidget);
    expect(find.text('80'), findsOneWidget);
    expect(find.text('Body Temperature'), findsOneWidget);
    expect(find.text('38.3'), findsOneWidget);
    expect(find.text('Motion Status'), findsOneWidget);
    expect(find.text('Your Location'), findsOneWidget);
    expect(find.bySemanticsLabel('SOS'), findsOneWidget);

    await tester.tap(find.text('Map'));
    await tester.pump();
    expect(find.text('Heart Rate'), findsNothing);
    expect(find.text('STATUS'), findsOneWidget);
    expect(find.text('Me'), findsNWidgets(2));
    expect(find.text('Enforcer 02'), findsNWidgets(2));
    expect(find.text('Almar Zabarte, Camarin Road'), findsOneWidget);
    // The user's own cap, in the header and on their status card.
    expect(find.text('CAP 014 - PSTMD-2026-084'), findsNWidgets(2));

    // There is no camera in tests, so the live view never gets past loading.
    await tester.tap(find.text('Camera'));
    await tester.pump();
    expect(find.text('RECORD'), findsOneWidget);
    expect(find.text('Live view'), findsOneWidget);
    expect(find.bySemanticsLabel('Start recording'), findsOneWidget);
    expect(find.bySemanticsLabel('Switch camera'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    await tester.tap(find.text('Alerts'));
    await tester.pump();
    expect(find.text('Alerts & Notification'), findsOneWidget);

    await tester.tap(find.text('Account'));
    await tester.pump();
    expect(find.text('ACCOUNT'), findsOneWidget);

    await tester.tap(find.text('Dashboard'));
    await tester.pump();
    expect(find.text('Heart Rate'), findsOneWidget);
  });

  testWidgets('Account opens its sheets, dialogs and the policy', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    var pairingChanges = 0;
    var loggedOut = false;
    await tester.pumpWidget(
      MaterialApp(
        home: HomeScreen(
          capName: 'CAP-014',
          profile: const UserProfile(email: 'user@gmail.com'),
          onChangePairing: () => pairingChanges++,
          onLogout: () => loggedOut = true,
        ),
      ),
    );
    await tester.tap(find.text('Account'));
    await tester.pump();
    expect(find.text('user@gmail.com'), findsOneWidget);

    await tester.tap(find.text('Battery'));
    await tester.pumpAndSettle();
    expect(find.text('Cap Battery'), findsOneWidget);
    expect(find.text('Estimated time left'), findsOneWidget);
    await tester.tapAt(const Offset(195, 120));
    await tester.pumpAndSettle();

    // "Connection" is also the title of the sheet it opens.
    await tester.tap(find.text('Connection'));
    await tester.pumpAndSettle();
    expect(find.text('LoRa relay'), findsOneWidget);
    await tester.tapAt(const Offset(195, 120));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Manage Pairing'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(pairingChanges, 0);
    await tester.tap(find.text('Manage Pairing'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Change Pairing'));
    await tester.pumpAndSettle();
    expect(pairingChanges, 1);

    await tester.ensureVisible(find.text('Read Full Policy'));
    await tester.tap(find.text('Read Full Policy'));
    await tester.pumpAndSettle();
    expect(find.byType(PrivacyPolicyScreen), findsOneWidget);
    expect(find.text('What we collect'), findsOneWidget);
    await tester.ensureVisible(find.text('Acknowledge'));
    await tester.tap(find.text('Acknowledge'));
    await tester.pumpAndSettle();
    expect(find.byType(PrivacyPolicyScreen), findsNothing);
    expect(find.text('ACCOUNT'), findsOneWidget);

    await tester.ensureVisible(find.text('Log out'));
    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(loggedOut, isFalse);
    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Log out').last);
    await tester.pumpAndSettle();
    expect(loggedOut, isTrue);
  });

  testWidgets('Edit Profile saves name and contact; email is view-only', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final saved = <String>[];
    var changePasswordOpened = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: HomeScreen(
          profile: const UserProfile(email: 'user@gmail.com'),
          onSaveProfile: (profile) async {
            if (profile.contactNumber == '09999999999') {
              return 'Contact number was rejected.';
            }
            saved.add(
              '${profile.name}/${profile.email}/${profile.contactNumber}',
            );
            return null;
          },
          onChangePassword: () => changePasswordOpened++,
        ),
      ),
    );
    await tester.tap(find.text('Account'));
    await tester.pump();

    Finder field(int index) => find.byType(TextField).at(index);
    Future<void> save() async {
      await tester.ensureVisible(find.text('Save Changes'));
      await tester.tap(find.text('Save Changes'));
      await tester.pumpAndSettle();
    }

    // Cancel leaves the profile alone.
    await tester.tap(find.text('Edit Profile'));
    await tester.pumpAndSettle();
    await tester.enterText(field(0), 'Someone Else');
    await tester.ensureVisible(find.text('Cancel'));
    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(find.byType(EditProfileScreen), findsNothing);
    expect(find.text('No name yet'), findsOneWidget);
    expect(saved, isEmpty);

    await tester.tap(find.text('Edit Profile'));
    await tester.pumpAndSettle();
    expect(
      tester.widget<TextField>(field(1)).controller!.text,
      'user@gmail.com',
    );

    // Only the admin can change the email.
    expect(tester.widget<TextField>(field(1)).readOnly, isTrue);
    expect(
      find.text('Only your station admin can change your email.'),
      findsOneWidget,
    );

    // Change Password opens its own screen.
    await tester.tap(find.text('Change Password'));
    expect(changePasswordOpened, 1);

    await tester.enterText(field(2), '12345');
    await save();
    expect(find.text('Please enter your name.'), findsOneWidget);
    expect(
      find.text('Enter a valid mobile number, e.g. 09171234567.'),
      findsOneWidget,
    );
    expect(saved, isEmpty);

    // The backend's answer is shown.
    await tester.enterText(field(0), 'Jeypi Denzo');
    await tester.enterText(field(2), '09999999999');
    await save();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(find.text('Contact number was rejected.'), findsOneWidget);

    await tester.enterText(field(2), '0917 123 4567');
    await save();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(saved, ['Jeypi Denzo/user@gmail.com/0917 123 4567']);
    expect(find.byType(EditProfileScreen), findsNothing);
    expect(find.text('Jeypi Denzo'), findsOneWidget);
    expect(find.textContaining('Jeypi!'), findsOneWidget);
  });

  testWidgets('Change Password checks the fields, then sends the code request', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final sent = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        home: ChangePasswordScreen(
          onSubmit: (current, next) async {
            if (current != 'Traffic#2026') return 'Current password is wrong.';
            sent.add('$current/$next');
            return null;
          },
        ),
      ),
    );
    Finder field(int index) => find.byType(TextField).at(index);

    await tester.tap(find.text('Send Code'));
    await tester.pump();
    expect(find.text('Please enter your current password.'), findsOneWidget);

    await tester.enterText(field(0), 'Traffic#2026');
    await tester.enterText(field(1), 'Traffic#2026');
    await tester.enterText(field(2), 'Traffic#2026');
    await tester.pump();
    await tester.tap(find.text('Send Code'));
    await tester.pump();
    expect(
      find.text('New password must be different from the current one.'),
      findsOneWidget,
    );

    await tester.enterText(field(0), 'Wrong#123456');
    await tester.enterText(field(1), 'Newpass#2026');
    await tester.enterText(field(2), 'Newpass#2026');
    await tester.pump();
    await tester.tap(find.text('Send Code'));
    await tester.pumpAndSettle();
    expect(find.text('Current password is wrong.'), findsOneWidget);

    await tester.enterText(field(0), 'Traffic#2026');
    await tester.pump();
    await tester.tap(find.text('Send Code'));
    await tester.pumpAndSettle();
    expect(sent, ['Traffic#2026/Newpass#2026']);
  });

  testWidgets('Alert filters narrow the list by type', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: AlertsTab(statusBar: SizedBox(), bottomPadding: 0),
        ),
      ),
    );
    const sos = 'Manual SOS sent';
    const heartRate = 'Elevated heart rate detected';
    const relay = 'Switched to LoRa relay';

    // All.
    expect(find.text(sos), findsNWidgets(2));
    expect(find.text(heartRate), findsOneWidget);
    expect(find.text(relay), findsOneWidget);
    expect(find.text('Today'), findsOneWidget);
    expect(find.text('Yesterday'), findsOneWidget);

    await tester.tap(find.text('Auto'));
    await tester.pump();
    expect(find.text(heartRate), findsOneWidget);
    expect(find.text(sos), findsNothing);
    expect(find.text(relay), findsNothing);
    expect(find.text('Today'), findsNothing);

    await tester.tap(find.text('Manual'));
    await tester.pump();
    expect(find.text(sos), findsNWidgets(2));
    expect(find.text(heartRate), findsNothing);
    expect(find.text('CAP 002'), findsOneWidget);

    // "System" is also the label on the system alert's card.
    await tester.tap(find.text('System').first);
    await tester.pump();
    expect(find.text(relay), findsOneWidget);
    expect(find.text(sos), findsNothing);

    await tester.tap(find.text('All'));
    await tester.pump();
    expect(find.text(sos), findsNWidgets(2));
    expect(find.text(relay), findsOneWidget);
  });

  testWidgets('Pairing walks through scanning to a connected cap', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    String? paired;
    await tester.pumpWidget(
      MaterialApp(home: PairingScreen(onDone: (name) => paired = name)),
    );
    expect(find.text('Step 1 of 3'), findsOneWidget);

    await tester.tap(find.text('Start Scanning'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('No thanks'));
    await tester.pumpAndSettle();
    expect(find.text('Step 1 of 3'), findsOneWidget);

    await tester.tap(find.text('Start Scanning'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Turn on Bluetooth'));
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.text('Step 2 of 3'), findsOneWidget);
    expect(find.text('Available devices (0)'), findsOneWidget);

    await tester.tap(find.text('Pair Device'));
    await tester.pump();
    expect(find.textContaining('Still scanning'), findsOneWidget);

    await tester.pump(const Duration(seconds: 3));
    expect(find.text('Available devices (3)'), findsOneWidget);

    await tester.tap(find.text('BLE-9F2'));
    await tester.pump();
    await tester.tap(find.text('Pair Device'));
    await tester.pump();
    expect(find.text('BLE-9F2 is not a CAPartner Smart Cap.'), findsOneWidget);

    await tester.tap(find.text('CAP-014'));
    await tester.pump();
    await tester.tap(find.text('Pair Device'));
    await tester.pump();
    expect(find.text('Pairing…'), findsOneWidget);
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('Step 3 of 3'), findsOneWidget);
    expect(find.text('CONNECTED'), findsOneWidget);
    expect(
      find.text('CAP-014 is now streaming vitals to your station.'),
      findsOneWidget,
    );

    await tester.tap(find.text('Go To Dashboard'));
    expect(paired, 'CAP-014');
  });

  testWidgets('The eye icon shows and hides the password', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const MaterialApp(home: PasswordScreen()));
    bool obscured() =>
        tester.widget<TextField>(find.byType(TextField).first).obscureText;

    expect(obscured(), isTrue);
    await tester.tap(find.bySemanticsLabel('Show password').first);
    await tester.pump();
    expect(obscured(), isFalse);
    await tester.tap(find.bySemanticsLabel('Hide password'));
    await tester.pump();
    expect(obscured(), isTrue);
  });
}
