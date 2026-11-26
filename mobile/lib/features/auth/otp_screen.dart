import 'package:flutter/material.dart';

import 'package:capartner/features/auth/widgets/otp_form.dart';
import 'package:capartner/features/auth/widgets/verification_layout.dart';

/// OTP verification screen, the second step of Forgot Password, also used to
/// confirm a password change.
///
/// [onVerify] checks the code once all six digits are entered, and [onResend]
/// asks for a new one; each returns the message to show when it fails.
class OtpScreen extends StatelessWidget {
  const OtpScreen({
    super.key,
    this.onVerify,
    this.onResend,
    this.email,
    this.title = 'Forgot Password',
    this.step = 1,
  });

  /// Title of the flow this step belongs to.
  final String title;

  /// Index in the step bar; null for no step bar.
  final int? step;

  /// Where the code was sent, shown under the heading when known.
  final String? email;

  final Future<String?> Function(String code)? onVerify;
  final Future<String?> Function()? onResend;

  @override
  Widget build(BuildContext context) {
    return VerificationScaffold(
      title: title,
      iconAsset: 'assets/images/mobile_email.png',
      heading: 'Verify Your Email',
      subheading: email == null
          ? 'Enter the 6-digit code sent to your email.'
          : 'Enter the 6-digit code we sent to',
      subheadingEmphasis: email,
      step: step,
      children: [
        const VerificationLabel('Verification code'),
        const SizedBox(height: 8),
        OtpForm(onVerify: onVerify, onResend: onResend),
        const SizedBox(height: 20),
        const VerificationNote(
          icon: Icons.mark_email_unread_outlined,
          text: "Can't find it? Check your spam folder.",
        ),
      ],
    );
  }
}
