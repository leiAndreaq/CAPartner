import 'package:flutter/material.dart';

import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/features/auth/widgets/otp_form.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Email verification asked for on a user's first login (Figma node 538:178).
///
/// [onVerify] is called with the code once all six digits are entered, and
/// [onResend] when the user asks for a new code. Checking the code is left to
/// the caller.
class LoginOtpScreen extends StatelessWidget {
  const LoginOtpScreen({super.key, this.onVerify, this.onResend});

  final ValueChanged<String>? onVerify;
  final VoidCallback? onResend;

  @override
  Widget build(BuildContext context) {
    return LoginScaffold(
      title: 'Verify',
      children: [
        const SizedBox(height: 35),
        Container(
          width: 119,
          height: 113,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: AppColors.darkGreen,
            borderRadius: BorderRadius.all(Radius.elliptical(59.5, 56.5)),
          ),
          child: Image.asset(
            'assets/images/mobile_email.png',
            width: 67,
            height: 67,
          ),
        ),
        const SizedBox(height: 27),
        Text(
          'OTP Verification',
          textAlign: TextAlign.center,
          maxLines: 1,
          style: authTextStyle(
            fontSize: 24,
            lineHeight: 35,
            weight: FontWeight.w800,
          ),
        ),
        Text(
          'Enter the 6-digit code sent to your email.',
          textAlign: TextAlign.center,
          style: authTextStyle(
            fontSize: 14,
            lineHeight: 35,
            weight: FontWeight.w400,
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 37),
        OtpForm(onVerify: onVerify, onResend: onResend),
      ],
    );
  }
}
