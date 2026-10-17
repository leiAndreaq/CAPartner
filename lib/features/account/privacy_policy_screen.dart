import 'package:flutter/material.dart';

import 'package:capartner/features/account/account_widgets.dart';
import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Full privacy policy, opened from the Account tab.
class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  /// Shown on the Account tab above "Read Full Policy".
  static const String summary =
      'CAPartner collects your vitals, location and recordings only to keep '
      'you safe on duty and to help responders reach you.';

  // Placeholder wording until the project's real policy is written.
  static const List<(String, String)> _sections = [
    (
      'What we collect',
      'Your account details (name, email and contact number), the readings '
          'from your Smart Cap (heart rate, body temperature and motion), '
          'your location while on duty, and the videos you record in the app.',
    ),
    (
      'How we use it',
      'Readings and location are used to monitor your safety, to raise '
          'automatic and manual SOS alerts, and to guide responders to you. '
          'Recordings are kept as a record of incidents.',
    ),
    (
      'Who can see it',
      'Only you and the authorized administrators of your station. Your '
          'data is never sold or shared for advertising.',
    ),
    (
      'How long we keep it',
      'Vitals and location history are kept while your account is active. '
          'You may ask your administrator to delete your account and its '
          'data at any time.',
    ),
    (
      'Your choices',
      'You can edit your profile, change the paired cap, and turn off '
          'Bluetooth or camera access from your phone settings. Some safety '
          'features stop working without them.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return AccountPageScaffold(
      title: 'Privacy Policy',
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              summary,
              style: appTextStyle(
                fontSize: 14,
                lineHeight: 21,
                weight: FontWeight.w600,
                color: AppColors.darkGreen,
              ),
            ),
            for (final (heading, body) in _sections) ...[
              const SizedBox(height: 20),
              Text(
                heading,
                style: appTextStyle(
                  fontSize: 16,
                  lineHeight: 24,
                  weight: FontWeight.w800,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                body,
                style: appTextStyle(
                  fontSize: 14,
                  lineHeight: 21,
                  weight: FontWeight.w400,
                  color: AppColors.bodyText,
                ),
              ),
            ],
            const SizedBox(height: 28),
            AuthButton(
              label: 'Acknowledge',
              onPressed: () => Navigator.of(context).pop(),
            ),
          ],
        ),
      ),
    );
  }
}
