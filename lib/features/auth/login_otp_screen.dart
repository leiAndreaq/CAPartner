import 'package:flutter/material.dart';

import 'package:capartner/features/auth/widgets/otp_form.dart';
import 'package:capartner/features/auth/widgets/verification_layout.dart';

/// Email verification asked for when logging in on a new phone, in the style
/// of the Forgot Password steps but without their step bar.
///
/// [onVerify] checks the code once all six digits are entered, and [onResend]
/// asks for a new one; each returns the message to show when it fails.
class LoginOtpScreen extends StatelessWidget {
  const LoginOtpScreen({super.key, this.onVerify, this.onResend, this.email});

  /// Where the code was sent, shown under the heading when known.
  final String? email;

  final Future<String?> Function(String code)? onVerify;
  final Future<String?> Function()? onResend;

  @override
  Widget build(BuildContext context) {
    return VerificationScaffold(
      title: 'Verify Login',
      icon: Icons.verified_user_rounded,
      heading: "Verify It's You",
      subheading: email == null
          ? 'For your security, enter the 6-digit code sent to your email.'
          : 'For your security, enter the 6-digit code we sent to',
      subheadingEmphasis: email,
      children: [
        const VerificationLabel('Verification code'),
        const SizedBox(height: 8),
        OtpForm(onVerify: onVerify, onResend: onResend),
        const SizedBox(height: 20),
        const VerificationNote(
          icon: Icons.shield_outlined,
          text: 'You only need to do this once on each phone.',
        ),
      ],
    );
  }
}
