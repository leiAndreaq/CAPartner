import 'package:flutter/material.dart';

import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/features/auth/widgets/otp_form.dart';

/// OTP verification screen (Figma node 528:43).
///
/// [onVerify] is called with the code once all six digits are entered, and
/// [onResend] when the user asks for a new code. Checking the code is left to
/// the caller.
class OtpScreen extends StatelessWidget {
  const OtpScreen({
    super.key,
    this.onVerify,
    this.onResend,
    this.title = 'OTP Verification',
  });

  /// Header title; the Forgot Password flow (Figma node 635:1930) shows its
  /// own name here.
  final String title;

  final ValueChanged<String>? onVerify;
  final VoidCallback? onResend;

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: title,
      titleTop: 40,
      titleLeftInset: 43,
      iconAsset: 'assets/images/mobile_email.png',
      iconSize: 90,
      heading: 'Verify Your Email',
      subheading: 'Enter the 6-digit code sent to your email.',
      children: [
        const SizedBox(height: 37),
        OtpForm(onVerify: onVerify, onResend: onResend),
        const SizedBox(height: 24),
      ],
    );
  }
}
