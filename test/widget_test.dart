import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:capartner/features/welcome/welcome_screen.dart';
import 'package:capartner/data/cap_reading.dart';
import 'package:capartner/data/local_database.dart';
import 'package:capartner/main.dart';
import 'package:capartner/features/home/home_screen.dart';
import 'package:capartner/features/account/edit_profile_screen.dart';
import 'package:capartner/features/account/privacy_policy_screen.dart';
import 'package:capartner/features/alerts/alerts_tab.dart';
import 'package:capartner/features/camera/camera_tab.dart';
import 'package:capartner/features/camera/clip_player_screen.dart';
import 'package:capartner/features/camera/recorded_clip.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/features/auth/email_screen.dart';
import 'package:capartner/features/auth/login_otp_screen.dart';
import 'package:capartner/features/auth/login_screen.dart';
import 'package:capartner/features/auth/otp_screen.dart';
import 'package:capartner/features/pairing/pairing_screen.dart';
import 'package:capartner/features/dashboard/vital_detail_screen.dart';
import 'package:capartner/features/dashboard/vital_trend_chart.dart';
import 'package:capartner/features/dashboard/vitals.dart';
import 'package:capartner/features/sos/sos_screen.dart';
import 'package:capartner/features/splash/splash_screen.dart';
import 'package:capartner/features/auth/password_screen.dart';
import 'package:capartner/features/auth/utils/email_validator.dart';
import 'package:capartner/features/auth/utils/password_validator.dart';

import 'fake_backend.dart';
import 'fake_cap_radio.dart';

/// The login form starts hidden below the logo; swipes it up.
Future<void> openLoginForm(WidgetTester tester) async {
  await tester.pump();
  await tester.fling(
    find.text('Swipe up to log in'),
    const Offset(0, -300),
    1000,
  );
  await tester.pump();
  await tester.pump(const Duration(seconds: 1));
}

/// Stands in for the Android side of [PhoneBluetooth]: Bluetooth starts off,
/// and Android's prompt answers [allowTurnOn].
void fakePhoneBluetooth({bool allowTurnOn = true}) {
  var on = false;
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(const MethodChannel('capartner/bluetooth'), (
        call,
      ) async {
        switch (call.method) {
          case 'isEnabled':
            return on;
          case 'requestEnable':
            on = allowTurnOn;
            return on;
        }
        return null;
      });
}

void main() {
  setUp(() {
    fakePhoneBluetooth();
    FlutterSecureStorage.setMockInitialValues({});
  });

  testWidgets('App starts on the splash screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      CAPartnerApp(
        followLocation: false,
        capRadio: FakeCapRadio(),
        api: FakeBackend().api(),
        database: (await tester.runAsync(testDatabase))!,
      ),
    );

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

  testWidgets('Tapping the splash screen opens the login screen', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(
      CAPartnerApp(
        followLocation: false,
        capRadio: FakeCapRadio(),
        api: FakeBackend().api(),
        database: (await tester.runAsync(testDatabase))!,
      ),
    );

    await tester.tap(find.byType(SplashScreen));
    // The login logo pulses forever, so settle is not usable there.
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(find.byType(LoginScreen), findsOneWidget);
  });

  testWidgets('Continue is enabled only for a valid email', (
    WidgetTester tester,
  ) async {
    // The default 800x600 test surface leaves the button below the fold.
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    String? submitted;
    await tester.pumpWidget(
      MaterialApp(
        home: EmailScreen(
          onContinue: (email) async {
            submitted = email;
            return null;
          },
        ),
      ),
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
      MaterialApp(
        home: EmailScreen(
          onContinue: (email) async {
            submitted = email;
            return null;
          },
        ),
      ),
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
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.textContaining('domain'), findsNothing);
    expect(find.bySemanticsLabel('Valid email'), findsOneWidget);

    await tester.tap(find.text('Continue'));
    expect(submitted, 'user@gmail.com');
  });

  testWidgets('Email is checked live and Continue shows what the server says', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        home: EmailScreen(
          onContinue: (email) async => "Can't reach the server.",
        ),
      ),
    );

    // Nothing is shown while still typing.
    await tester.enterText(find.byType(TextField), 'user');
    await tester.pump(const Duration(milliseconds: 200));
    expect(find.text('Email address must include "@".'), findsNothing);

    // A pause shows the format error without tapping Continue.
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.text('Email address must include "@".'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'user@gmail.com');
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.bySemanticsLabel('Valid email'), findsOneWidget);

    await tester.tap(find.text('Continue'));
    await tester.pump();
    expect(find.text("Can't reach the server."), findsOneWidget);
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

  testWidgets('A full OTP is sent by itself and a wrong one is shown', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final verified = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        home: OtpScreen(
          email: 'user@gmail.com',
          onVerify: (code) async {
            verified.add(code);
            return 'Wrong code. 4 tries left.';
          },
        ),
      ),
    );
    expect(find.textContaining('user@gmail.com'), findsOneWidget);
    expect(find.bySemanticsLabel('Step 2 of 3'), findsOneWidget);

    await tester.enterText(find.byType(TextField), '123456');
    await tester.pump();
    expect(find.text('Verifying code...'), findsOneWidget);
    expect(verified, isEmpty);

    await tester.pump(const Duration(milliseconds: 700));
    expect(verified, ['123456']);
    expect(find.text('Verifying code...'), findsNothing);
    expect(find.text('Wrong code. 4 tries left.'), findsOneWidget);

    // Typing again clears the server's answer.
    await tester.enterText(find.byType(TextField), '12345');
    await tester.pump();
    expect(find.text('Wrong code. 4 tries left.'), findsNothing);
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
    expect(find.text('A new code was sent to your email.'), findsOneWidget);

    await tester.pump(const Duration(seconds: 30));
    expect(find.text('Resend OTP'), findsOneWidget);
  });

  testWidgets('A failed resend shows why and allows another try', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        home: OtpScreen(
          onResend: () async =>
              'We could not send the code email. Please try again.',
        ),
      ),
    );

    await tester.tap(find.text('Resend OTP'));
    await tester.pump();

    expect(
      find.text('We could not send the code email. Please try again.'),
      findsOneWidget,
    );
    expect(find.text('Resend OTP'), findsOneWidget);
  });

  test('validatePassword requires a strong password', () {
    expect(validatePassword(''), 'Please enter a password.');
    expect(validatePassword('Ab1!'), 'Use at least 10 characters.');
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

  testWidgets('New password accepts only a strong, matching password', (
    WidgetTester tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    addTearDown(tester.view.reset);

    String? created;
    await tester.pumpWidget(
      MaterialApp(
        home: PasswordScreen.firstLogin(
          onSubmit: (p) async {
            created = p;
            return p == 'user@gmail.com' ? 'Too close to the email.' : null;
          },
        ),
      ),
    );
    // Lets the sheet finish sliding in.
    await tester.pump(const Duration(seconds: 1));

    // The test font is wide enough to push the button below the fold.
    Future<void> tapCreate() async {
      await tester.ensureVisible(find.text('Create Password'));
      await tester.tap(find.text('Create Password'));
    }

    // Every rule starts out missing.
    expect(find.bySemanticsLabel('Uppercase letter: missing'), findsOneWidget);

    await tapCreate();
    await tester.pump();
    expect(find.text('Please confirm your password.'), findsOneWidget);

    // Rules tick off live as the password is typed.
    await tester.enterText(find.byType(TextField).first, 'abcdefgh1!');
    await tester.pump();
    expect(find.bySemanticsLabel('Lowercase letter: done'), findsOneWidget);
    expect(find.bySemanticsLabel('Uppercase letter: missing'), findsOneWidget);

    await tester.enterText(find.byType(TextField).first, 'Abcdefgh1!');
    await tester.enterText(find.byType(TextField).last, 'Abcdefgh1');
    await tester.pump();
    expect(find.text('Passwords do not match.'), findsOneWidget);
    await tapCreate();
    expect(created, isNull);

    await tester.enterText(find.byType(TextField).last, 'Abcdefgh1!');
    await tester.pump();
    expect(find.text('Passwords match'), findsOneWidget);
    await tapCreate();
    expect(created, 'Abcdefgh1!');
  });

  testWidgets('Met password rules fade away and return when broken', (
    WidgetTester tester,
  ) async {
    tester.view.devicePixelRatio = 1;
    tester.view.physicalSize = const Size(390, 844);
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      const MaterialApp(home: PasswordScreen.forgotPassword()),
    );
    await tester.pump(const Duration(seconds: 1));

    // A met rule stays, ticked, for a moment before it goes.
    await tester.enterText(find.byType(TextField).first, 'abc');
    await tester.pump();
    expect(find.bySemanticsLabel('Lowercase letter: done'), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 800));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('a-z'), findsNothing);
    expect(find.text('A-Z'), findsOneWidget);

    // Breaking the rule brings it straight back.
    await tester.enterText(find.byType(TextField).first, 'ABC');
    await tester.pump();
    expect(find.bySemanticsLabel('Lowercase letter: missing'), findsOneWidget);

    // Once every rule is met they make way for a single note.
    await tester.enterText(find.byType(TextField).first, 'Abcdefgh1!');
    await tester.pump(const Duration(milliseconds: 800));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Strong password'), findsOneWidget);
    expect(find.text('10+ chars'), findsNothing);
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
            await Future<void>.delayed(const Duration(milliseconds: 500));
            return password == 'Abcdefgh1!' ? null : 'Incorrect password.';
          },
        ),
      ),
    );
    await openLoginForm(tester);

    await tester.tap(find.text('Log In'));
    await tester.pump();
    expect(find.text('Please enter your email or username.'), findsOneWidget);
    expect(find.text('Please enter your password.'), findsOneWidget);
    expect(attempts, isEmpty);

    await tester.enterText(find.byType(TextField).first, 'user@gmail.com');
    await tester.enterText(find.byType(TextField).last, 'wrong');
    await tester.pump();
    await tester.tap(find.text('Log In'));
    await tester.pump();
    // A spinner shows while the server checks the login.
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Incorrect password.'), findsOneWidget);

    await tester.tap(find.text('Remember me'));
    await tester.enterText(find.byType(TextField).last, 'Abcdefgh1!');
    await tester.pump();
    expect(find.text('Incorrect password.'), findsNothing);
    await tester.tap(find.text('Log In'));
    await tester.pump(const Duration(milliseconds: 500));
    expect(attempts, [
      'user@gmail.com/wrong/true',
      'user@gmail.com/Abcdefgh1!/false',
    ]);
  });

  testWidgets('Login fits a small phone and has no sign-up link', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(360, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
    // The logo pulses forever, so settle is not usable there.
    await tester.pump(const Duration(seconds: 1));
    await openLoginForm(tester);

    // Accounts are made by the admin, not in the app.
    expect(find.text('Sign up'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Swiping up shows the login form and down hides it', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
    await tester.pump(const Duration(seconds: 1));

    // Only the logo and title at first.
    expect(find.text('Welcome back'), findsOneWidget);
    expect(find.text('Log In'), findsNothing);

    await openLoginForm(tester);
    expect(find.text('Log In'), findsOneWidget);

    // A short, slow drag springs back open.
    await tester.drag(find.text('Email or username'), const Offset(0, 40));
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Log In'), findsOneWidget);

    await tester.fling(
      find.text('Email or username'),
      const Offset(0, 300),
      1000,
    );
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Log In'), findsNothing);

    // Tapping the hint opens it too.
    await tester.tap(find.text('Swipe up to log in'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Log In'), findsOneWidget);
  });

  testWidgets('The login form bounces past open and settles back', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const MaterialApp(home: LoginScreen()));
    await tester.pump(const Duration(seconds: 1));
    await tester.tap(find.text('Swipe up to log in'));
    await tester.pump();

    double fieldTop() => tester.getTopLeft(find.text('Email or username')).dy;
    var highest = double.infinity;
    for (var i = 0; i < 60; i++) {
      await tester.pump(const Duration(milliseconds: 16));
      if (fieldTop() < highest) highest = fieldTop();
    }
    // The logo pulses forever, so settle is not usable here.
    await tester.pump(const Duration(seconds: 1));

    // It rose above where it rests, then came back down.
    expect(highest, lessThan(fieldTop() - 4));
  });

  testWidgets('A new phone needs the emailed code; a known one does not', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final backend = FakeBackend();
    final verifyButton = find.widgetWithText(FilledButton, 'Verify');

    // The login logo pulses forever, so settle is only usable once the
    // login screen is gone or covered.
    Future<void> settle() async {
      await tester.pump();
      // Covers the server round trip, then the page transition.
      await tester.pump(const Duration(seconds: 1));
      await tester.pump(const Duration(seconds: 1));
      // The verification screens' icons pulse forever too.
      if (find.byType(LoginScreen).evaluate().isEmpty &&
          find.byType(LoginOtpScreen).evaluate().isEmpty &&
          find.byType(OtpScreen).evaluate().isEmpty &&
          find.byType(PasswordScreen).evaluate().isEmpty &&
          find.byType(EmailScreen).evaluate().isEmpty) {
        await tester.pumpAndSettle();
      }
    }

    Future<void> logOut() async {
      await tester.tap(find.text('Account'));
      await tester.pump();
      await tester.ensureVisible(find.text('Log out'));
      await tester.tap(find.text('Log out'));
      await tester.pumpAndSettle();
      // Confirm in the dialog.
      await tester.tap(find.text('Log out').last);
      await settle();
    }

    Future<void> logIn(String password, {bool remember = true}) async {
      if (find.text('Log In').evaluate().isEmpty) await openLoginForm(tester);
      await tester.enterText(find.byType(TextField).first, 'user@gmail.com');
      await tester.enterText(find.byType(TextField).last, password);
      if (!remember) await tester.tap(find.text('Remember me'));
      await tester.pump();
      await tester.tap(find.text('Log In'));
      await settle();
    }

    Future<void> enterCode(String code) async {
      await tester.enterText(find.byType(TextField), code);
      await tester.pump();
      await tester.tap(verifyButton);
      await settle();
    }

    await tester.pumpWidget(
      CAPartnerApp(
        followLocation: false,
        capRadio: FakeCapRadio(),
        api: backend.api(),
        database: (await tester.runAsync(testDatabase))!,
      ),
    );
    await tester.tap(find.byType(SplashScreen));
    await settle();
    expect(find.byType(LoginScreen), findsOneWidget);

    await logIn('Wrong#Pass123');
    expect(find.text('Invalid email or password.'), findsOneWidget);

    // First login: the code, then a password in place of the temporary one.
    await logIn('Temp#Pass123', remember: false);
    expect(find.byType(LoginOtpScreen), findsOneWidget);
    expect(backend.codesSent, 1);
    expect(
      find.textContaining('user@gmail.com', findRichText: true),
      findsOneWidget,
    );
    // Not part of Forgot Password, so no step bar.
    expect(find.text('Password'), findsNothing);

    await tester.tap(find.text('Resend OTP'));
    await tester.pump();
    expect(backend.codesSent, 2);

    await enterCode('000000');
    expect(find.text('Wrong code. 4 tries left.'), findsOneWidget);

    await enterCode(FakeBackend.code);
    expect(find.byType(PasswordScreen), findsOneWidget);
    expect(find.text('Create Your Password'), findsOneWidget);
    await tester.enterText(find.byType(TextField).first, 'Mine#Pass456');
    await tester.enterText(find.byType(TextField).last, 'Mine#Pass456');
    await tester.pump();
    await tester.ensureVisible(find.text('Create Password'));
    await tester.tap(find.text('Create Password'));

    // The loading screen moves on by itself.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(WelcomeScreen), findsOneWidget);
    expect(backend.password, 'Mine#Pass456');
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
    expect(find.text('CAP 001'), findsOneWidget);

    // The server remembers this phone until it logs out, so logging in
    // again would skip the code; logging out makes the next one ask again.
    await logOut();
    expect(backend.knownDevice, isNull);
    await logIn('Mine#Pass456');
    expect(find.byType(LoginOtpScreen), findsOneWidget);
    await enterCode(FakeBackend.code);
    expect(find.byType(HomeScreen), findsOneWidget);

    // Forgot password.
    await logOut();
    await openLoginForm(tester);
    await tester.tap(find.text('Forgot Password?'));
    await settle();
    await tester.enterText(find.byType(TextField), 'user@gmail.com');
    await tester.pump();
    await tester.tap(find.text('Continue'));
    await settle();
    expect(find.byType(OtpScreen), findsOneWidget);
    await enterCode(FakeBackend.code);
    await tester.enterText(find.byType(TextField).first, 'Newer#Pass789');
    await tester.enterText(find.byType(TextField).last, 'Newer#Pass789');
    await tester.pump();
    await tester.ensureVisible(find.text('Update Password'));
    await tester.tap(find.text('Update Password'));
    await settle();
    // Setting the password also logs in.
    expect(find.byType(HomeScreen), findsOneWidget);
    expect(backend.password, 'Newer#Pass789');
  });

  testWidgets('Remember me skips the login on the next launch', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    FlutterSecureStorage.setMockInitialValues({'session_token': 'token-1'});

    await tester.pumpWidget(
      CAPartnerApp(
        followLocation: false,
        capRadio: FakeCapRadio(),
        api: FakeBackend().api(),
        database: (await tester.runAsync(testDatabase))!,
      ),
    );
    await tester.tap(find.byType(SplashScreen));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(WelcomeScreen), findsOneWidget);
    expect(find.byType(LoginScreen), findsNothing);
  });

  testWidgets('Packets from the paired cap go to the server', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    FlutterSecureStorage.setMockInitialValues({'session_token': 'token-1'});
    final backend = FakeBackend()..mustChangePassword = false;
    final radio = FakeCapRadio();

    await tester.pumpWidget(
      CAPartnerApp(
        followLocation: false,
        capRadio: radio,
        api: backend.api(),
        database: (await tester.runAsync(testDatabase))!,
      ),
    );
    await tester.tap(find.byType(SplashScreen));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Start Scanning'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Turn on Bluetooth'));
    await tester.pump(const Duration(seconds: 3));
    await tester.tap(find.text('CAP-001'));
    await tester.pump();
    await tester.tap(find.text('Pair Device'));
    await tester.pump(const Duration(seconds: 2));
    expect(radio.connected?.name, 'CAP-001');
    await tester.tap(find.text('Go To Dashboard'));
    await tester.pumpAndSettle();

    // A reading without a time (the cap has no clock yet), a broken packet,
    // which is skipped, and the cap's SOS button.
    radio.send('{"heartRateBpm":95,"bodyTempC":36.9,"batteryPct":64}');
    radio.send('not json');
    radio.send('{"type":"sos","holdSeconds":3}');
    await tester.runAsync(() async {
      for (var i = 0; i < 100; i++) {
        if (backend.readings.isNotEmpty && backend.alerts.isNotEmpty) break;
        await Future<void>.delayed(const Duration(milliseconds: 50));
      }
    });
    expect(backend.readings.single['heartRateBpm'], 95);
    expect(backend.readings.single['recordedAt'], isNotNull);
    expect(backend.alerts.single['origin'], 'cap_button');
    expect(backend.alerts.single['sosHoldSeconds'], 3);

    // Logging out lets go of the cap.
    await tester.tap(find.text('Account'));
    await tester.pump();
    await tester.ensureVisible(find.text('Log out'));
    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Log out').last);
    // The login screen animates forever, so settle is not usable there.
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    expect(find.byType(LoginScreen), findsOneWidget);
    expect(radio.connected, isNull);
  });

  testWidgets('Edit Profile saves to the server and confirms a new password', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    FlutterSecureStorage.setMockInitialValues({'session_token': 'token-1'});
    final backend = FakeBackend()
      ..mustChangePassword = false
      ..password = 'Mine#Pass456';

    // Logged in by "Remember me", then paired.
    await tester.pumpWidget(
      CAPartnerApp(
        followLocation: false,
        capRadio: FakeCapRadio(),
        api: backend.api(),
        database: (await tester.runAsync(testDatabase))!,
      ),
    );
    await tester.tap(find.byType(SplashScreen));
    await tester.pumpAndSettle();
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

    await tester.tap(find.text('Account'));
    await tester.pump();
    expect(find.text('Juan Dela Cruz'), findsOneWidget);
    await tester.tap(find.text('Edit Profile'));
    await tester.pumpAndSettle();

    Finder field(int index) => find.byType(TextField).at(index);
    await tester.enterText(field(0), 'Test Name');
    await tester.enterText(field(2), 'Mine#Pass456');
    await tester.enterText(field(3), 'Newer#Pass789');
    await tester.enterText(field(4), '0917 123 4567');
    await tester.ensureVisible(find.text('Save Changes'));
    await tester.tap(find.text('Save Changes'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Save'));
    // The code screen's icon pulses forever, so settle is not usable there.
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    // Name and contact are saved; the password waits for the emailed code.
    expect(backend.fullName, 'Test Name');
    expect(backend.contactNumber, '09171234567');
    expect(find.byType(OtpScreen), findsOneWidget);
    expect(find.text('Change Password'), findsOneWidget);
    expect(backend.password, 'Mine#Pass456');

    await tester.enterText(find.byType(TextField), FakeBackend.code);
    await tester.pump();
    await tester.tap(find.widgetWithText(FilledButton, 'Verify'));
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));
    await tester.pumpAndSettle();

    expect(backend.password, 'Newer#Pass789');
    expect(find.byType(OtpScreen), findsNothing);
    expect(find.byType(EditProfileScreen), findsNothing);
    expect(find.text('Test Name'), findsOneWidget);
  });

  testWidgets('Dashboard shows the readings and switches tabs', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const MaterialApp(home: HomeScreen(capName: 'CAP-014')),
    );

    expect(find.text('CAP 014'), findsOneWidget);
    expect(find.text('DASHBOARD'), findsOneWidget);
    expect(find.text('Heart Rate'), findsOneWidget);
    expect(find.text('Body Temperature'), findsOneWidget);
    expect(find.text('Motion Status'), findsOneWidget);
    // No readings or battery until the cap sends them.
    expect(find.text('--'), findsNWidgets(4));
    expect(find.text('Your Location'), findsOneWidget);
    expect(find.bySemanticsLabel('SOS'), findsOneWidget);

    await tester.tap(find.text('Map'));
    await tester.pump();
    expect(find.text('Heart Rate'), findsNothing);
    expect(find.text('Team Status'), findsOneWidget);
    expect(find.text('Me'), findsOneWidget);
    // No made-up teammates on the map.
    expect(find.text('Enforcer 02'), findsNothing);
    expect(find.byTooltip('Show my location'), findsOneWidget);
    // The user's own cap, in the header and on their status card.
    expect(find.text('CAP 014'), findsNWidgets(2));

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
    await tester.pump();
    expect(find.text('Heart Rate'), findsOneWidget);

    // The location card's map opens the Map tab.
    final openMap = find.bySemanticsLabel(RegExp('Open map'));
    await tester.ensureVisible(openMap);
    await tester.tap(openMap);
    await tester.pump();
    expect(find.text('Team Status'), findsOneWidget);
  });

  testWidgets('Holding SOS sends it; holding Cancel Alarm goes back', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    Future<void> holdOn(Finder finder) async {
      final gesture = await tester.startGesture(tester.getCenter(finder));
      for (var i = 0; i < 25; i++) {
        await tester.pump(const Duration(milliseconds: 100));
      }
      await gesture.up();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
    }

    await tester.pumpWidget(
      const MaterialApp(home: HomeScreen(capName: 'CAP-014')),
    );
    await tester.tap(find.bySemanticsLabel('SOS'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.byType(SosScreen), findsOneWidget);

    // A tap only explains how to send it.
    await tester.tap(find.text('Press & hold'));
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.text('Hold the button until the ring fills.'), findsOneWidget);
    expect(find.text('SOS Sent'), findsNothing);

    await holdOn(find.text('Press & hold'));
    expect(find.text('SOS Sent'), findsOneWidget);
    expect(find.text('Admin · Station'), findsOneWidget);

    // Neither a tap nor the back button closes the modal.
    await tester.tap(find.text('Cancel Alarm'));
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.text('Keep holding until the button fills.'), findsOneWidget);
    await tester.binding.handlePopRoute();
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.text('SOS Sent'), findsOneWidget);

    await holdOn(find.text('Cancel Alarm'));
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.byType(SosScreen), findsNothing);
    expect(find.text('Heart Rate'), findsOneWidget);
  });

  testWidgets('The SOS modal changes once the admin acknowledges it', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    Future<void> holdOn(Finder finder) async {
      final gesture = await tester.startGesture(tester.getCenter(finder));
      for (var i = 0; i < 25; i++) {
        await tester.pump(const Duration(milliseconds: 100));
      }
      await gesture.up();
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 400));
    }

    AlertRecord sos({DateTime? acknowledgedAt}) => AlertRecord(
      eventUid: 'sos-1',
      type: 'sos',
      origin: 'mobile_app',
      title: 'Manual SOS sent',
      detail: 'SOS sent from the CAPartner app',
      occurredAt: DateTime.now().toUtc(),
      syncState: SyncState.sent,
      acknowledgedAt: acknowledgedAt,
    );
    final alerts = ValueNotifier<List<AlertRecord>>([]);

    await tester.pumpWidget(
      MaterialApp(
        home: HomeScreen(
          capName: 'CAP-014',
          alerts: alerts,
          onSosSent: () async {
            alerts.value = [sos()];
            return 'sos-1';
          },
        ),
      ),
    );
    await tester.tap(find.bySemanticsLabel('SOS'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    await holdOn(find.text('Press & hold'));

    // Sent, but the admin has not answered: nothing says help is coming.
    expect(find.text('SOS Sent'), findsOneWidget);
    expect(find.text('Waiting for your admin to acknowledge'), findsOneWidget);
    expect(find.text('Sent · waiting for admin'), findsOneWidget);
    expect(find.text('Cancel Alarm'), findsOneWidget);
    expect(find.textContaining('Help is on the way'), findsNothing);

    // The admin acknowledges it.
    alerts.value = [sos(acknowledgedAt: DateTime.now().toUtc())];
    await tester.pump();
    expect(find.text('SOS Acknowledged'), findsOneWidget);
    expect(find.text('Acknowledged by admin'), findsOneWidget);
    expect(
      find.textContaining('acknowledged your alert and help is on the way'),
      findsOneWidget,
    );
    expect(find.text('Cancel Alarm'), findsNothing);
    final button = find.text('Admin acknowledged · Help is on the way');
    expect(button, findsOneWidget);

    // Still closed only by holding the button.
    await holdOn(button);
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.byType(SosScreen), findsNothing);
  });

  testWidgets('Dashboard shows the overall status and opens each reading', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const MaterialApp(home: HomeScreen(capName: 'CAP-014')),
    );
    // The banner and each reading's pill.
    expect(find.text('No Data'), findsNWidgets(4));
    expect(
      find.text('Waiting for readings from your Smart Cap'),
      findsOneWidget,
    );

    Future<void> openAndClose(String card, String section) async {
      final target = find.bySemanticsLabel(RegExp('^$card'));
      // Clear of the tab bar that floats over the bottom of the list.
      await Scrollable.ensureVisible(tester.element(target), alignment: 0.5);
      await tester.pumpAndSettle();
      await tester.tap(target);
      await tester.pumpAndSettle();
      expect(find.text(section), findsOneWidget);
      await tester.tap(find.byTooltip('Back'));
      await tester.pumpAndSettle();
      expect(find.text('DASHBOARD'), findsOneWidget);
    }

    await openAndClose('Heart rate details', 'LAST 30 MINUTES');
    await openAndClose('Body temperature details', 'LAST 2 HOURS');
    await openAndClose('Motion details', 'ACTIVITY LOG');
  });

  testWidgets('Vital trend charts read out the touched point', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const MaterialApp(home: TemperatureScreen(vitals: Vitals.sample)),
    );
    final chart = find.byType(VitalTrendChart);
    await tester.drag(chart, const Offset(-40, 0));
    await tester.pump();
    expect(find.text('Lowest'), findsOneWidget);
    expect(find.text('36.8 °C'), findsOneWidget);
    expect(find.text('NOW'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Sample readings set the overall status', (
    WidgetTester tester,
  ) async {
    // 38.3 °C is above the admin's default limit of 38.0 °C.
    expect(Vitals.sample.overall, VitalStatus.unstable);
    expect(
      Vitals.sample.overallReason,
      'Body temperature is dangerously high (38.3 °C, safe up to 38.0)',
    );
    expect(Vitals.empty.overall, VitalStatus.noData);

    // 29.2 °C is below the 30.0 °C floor, so it is unstable and says so.
    final cold = Vitals.fromReadings(
      [CapReading(recordedAt: DateTime.now().toUtc(), bodyTempC: 29.2)],
      thresholds: VitalThresholds.defaults,
      now: DateTime.now().toUtc(),
    );
    expect(cold.temperatureStatus, VitalStatus.unstable);
    expect(cold.temperatureLabel, 'Too low');
    expect(
      cold.overallReason,
      'Body temperature is dangerously low (29.2 °C, safe from 30.0)',
    );
  });

  testWidgets('Detail screens show placeholders without readings', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(const MaterialApp(home: HeartRateScreen()));
    expect(find.byType(VitalTrendChart), findsNothing);
    expect(find.text('No data yet'), findsOneWidget);
    expect(tester.takeException(), isNull);
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
    await tester.tapAt(const Offset(195, 120));
    await tester.pumpAndSettle();

    // "Connection" is also the title of the sheet it opens.
    await tester.tap(find.text('Connection'));
    await tester.pumpAndSettle();
    expect(find.text('No data yet'), findsOneWidget);
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

  testWidgets('Edit Profile validates, then saves or cancels', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final saved = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        home: HomeScreen(
          capName: 'CAP-014',
          profile: const UserProfile(email: 'user@gmail.com'),
          onSaveProfile: (profile, passwordChange) async {
            if (passwordChange?.current == 'Wrong#Pass1') {
              return 'Current password is wrong.';
            }
            saved.add(
              '${profile.name}/${profile.email}/${passwordChange?.current}/'
              '${passwordChange?.next}/${profile.contactNumber}',
            );
            return null;
          },
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
    // Only the admin can change the email.
    expect(
      tester.widget<TextField>(field(1)).controller!.text,
      'user@gmail.com',
    );
    expect(tester.widget<TextField>(field(1)).readOnly, isTrue);

    await tester.enterText(field(3), 'weak');
    await tester.enterText(field(4), '12345');
    await save();
    expect(find.text('Please enter your name.'), findsOneWidget);
    expect(
      find.text('Enter your current password to change it.'),
      findsOneWidget,
    );
    expect(find.text('Use at least 10 characters.'), findsOneWidget);
    expect(
      find.text('Enter a valid mobile number, e.g. 09171234567.'),
      findsOneWidget,
    );
    expect(saved, isEmpty);

    // The server's answer shows above the buttons.
    await tester.enterText(field(0), 'Test Name');
    await tester.enterText(field(2), 'Wrong#Pass1');
    await tester.enterText(field(3), 'Newpass22@');
    await tester.enterText(field(4), '0917 123 4567');
    await save();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(find.text('Current password is wrong.'), findsOneWidget);
    expect(find.byType(EditProfileScreen), findsOneWidget);

    await tester.enterText(field(2), 'Old#Pass123');
    await tester.pump();
    expect(find.text('Current password is wrong.'), findsNothing);
    await save();
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(saved, [
      'Test Name/user@gmail.com/Old#Pass123/Newpass22@/0917 123 4567',
    ]);
    expect(find.byType(EditProfileScreen), findsNothing);
    expect(find.text('Test Name'), findsOneWidget);
    expect(find.textContaining('Test!'), findsOneWidget);
  });

  testWidgets('Alerts show only the ones raised on this phone', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    // Nothing to show until an alert is raised: no sample alerts.
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: AlertsTab(statusBar: SizedBox(), bottomPadding: 0),
        ),
      ),
    );
    expect(find.text('Manual SOS sent'), findsNothing);

    final now = DateTime.now().toUtc();
    AlertRecord record(String uid, String type, String origin, String title) =>
        AlertRecord(
          eventUid: uid,
          type: type,
          origin: origin,
          title: title,
          detail: 'Detail of $title',
          occurredAt: now,
        );
    const sos = 'Manual SOS sent';
    const heartRate = 'Elevated heart rate detected';
    const pairing = 'Unauthorized cap pairing attempt';
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: AlertsTab(
            statusBar: const SizedBox(),
            bottomPadding: 0,
            alerts: [
              record('1', 'sos', 'mobile_app', sos),
              record('2', 'health', 'vitals_rule', heartRate),
              record('3', 'device', 'system', pairing),
            ],
          ),
        ),
      ),
    );

    // All.
    expect(find.text(sos), findsOneWidget);
    expect(find.text(heartRate), findsOneWidget);
    expect(find.text(pairing), findsOneWidget);

    await tester.tap(find.text('Auto'));
    await tester.pump();
    expect(find.text(heartRate), findsOneWidget);
    expect(find.text(sos), findsNothing);
    expect(find.text(pairing), findsNothing);

    await tester.tap(find.text('Manual'));
    await tester.pump();
    expect(find.text(sos), findsOneWidget);
    expect(find.text(heartRate), findsNothing);

    // The filter row scrolls sideways; System starts past the edge. The
    // incident of a cap that is not the user's is a system alert.
    await tester.ensureVisible(find.text('System'));
    await tester.tap(find.text('System'));
    await tester.pump();
    expect(find.text(pairing), findsOneWidget);
    expect(find.text(sos), findsNothing);

    await tester.ensureVisible(find.text('All'));
    await tester.tap(find.text('All'));
    await tester.pump();
    expect(find.text(pairing), findsOneWidget);
  });

  testWidgets('Pairing walks through scanning to a connected cap', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    String? paired;
    final unauthorized = <String>[];
    await tester.pumpWidget(
      MaterialApp(
        home: PairingScreen(
          radio: FakeCapRadio(),
          assignedCap: 'CAP-014',
          onUnauthorized: unauthorized.add,
          onDone: (name) => paired = name,
        ),
      ),
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

    // A cap that is not the one assigned to this account is refused and
    // reported.
    await tester.tap(find.text('CAP-001'));
    await tester.pump();
    await tester.tap(find.text('Pair Device'));
    await tester.pump();
    expect(find.textContaining('not the cap assigned to you'), findsOneWidget);
    expect(find.text('Pairing…'), findsNothing);
    expect(unauthorized, ['CAP-001']);

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

  testWidgets('Pairing stays put when Bluetooth is not turned on', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    fakePhoneBluetooth(allowTurnOn: false);

    await tester.pumpWidget(
      MaterialApp(
        home: PairingScreen(radio: FakeCapRadio(), assignedCap: 'CAP-001'),
      ),
    );
    await tester.tap(find.text('Start Scanning'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Turn on Bluetooth'));
    await tester.pumpAndSettle();
    expect(find.text('Step 1 of 3'), findsOneWidget);
    expect(
      find.text('Bluetooth is still off. Turn it on to pair your cap.'),
      findsOneWidget,
    );
  });

  testWidgets('Pairing skips the Bluetooth prompt when it is already on', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
          const MethodChannel('capartner/bluetooth'),
          (call) async => true,
        );

    await tester.pumpWidget(
      MaterialApp(
        home: PairingScreen(radio: FakeCapRadio(), assignedCap: 'CAP-001'),
      ),
    );
    await tester.tap(find.text('Start Scanning'));
    // The scan animates forever, so settle is not usable there.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.text('Bluetooth is off'), findsNothing);
    expect(find.text('Step 2 of 3'), findsOneWidget);
  });

  testWidgets('Pairing fits a small phone', (WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(360, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        home: PairingScreen(radio: FakeCapRadio(), assignedCap: 'CAP-001'),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Start Scanning'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Turn on Bluetooth'));
    // The scan animates forever, so settle is not usable there.
    await tester.pump(const Duration(seconds: 3));
    await tester.tap(find.text('CAP-001'));
    await tester.pump();
    await tester.tap(find.text('Pair Device'));
    await tester.pump(const Duration(seconds: 2));
    await tester.pumpAndSettle();
    expect(find.text('Smart Cap connected'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('The eye icon shows and hides the password', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      const MaterialApp(home: PasswordScreen.forgotPassword()),
    );
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

  test('Clip lengths and times are formatted for display', () {
    expect(formatClipLength(const Duration(seconds: 42)), '00:42');
    expect(formatClipLength(CameraTab.maxClipLength), '01:00');
    expect(formatClipTime(DateTime(2026, 10, 21, 9, 51)), '09:51 AM');
    expect(formatClipTime(DateTime(2026, 10, 21, 0, 5)), '12:05 AM');
    expect(formatClipTime(DateTime(2026, 10, 21, 13, 0)), '01:00 PM');
  });

  testWidgets('Tapping a saved clip opens the player', (
    WidgetTester tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final clip = RecordedClip(
      path: 'missing.mp4',
      recordedAt: DateTime(2026, 10, 21, 9, 51),
      length: const Duration(seconds: 42),
    );
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: CameraTab(
              statusBar: const SizedBox(),
              location: 'Vicas Market',
              clips: [clip],
            ),
          ),
        ),
      ),
    );

    expect(find.text('RECENT CLIPS'), findsOneWidget);
    expect(find.text('MAX 1:00'), findsOneWidget);
    expect(find.text('00:42'), findsOneWidget);

    // Neither the camera nor the video loads in tests, so their spinners
    // never stop; pump past the page transition instead of settling.
    await tester.tap(find.bySemanticsLabel('Play clip from 09:51 AM'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(ClipPlayerScreen), findsOneWidget);
    expect(find.text('Recorded clip'), findsOneWidget);
    expect(find.text('09:51 AM · 00:42'), findsOneWidget);

    await tester.tap(find.byTooltip('Close'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(ClipPlayerScreen), findsNothing);
  });
}
