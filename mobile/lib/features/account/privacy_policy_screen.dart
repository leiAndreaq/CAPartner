import 'package:flutter/material.dart';

import 'package:capartner/features/account/account_widgets.dart';
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
  static const List<(IconData, String, String)> _sections = [
    (
      Icons.inventory_2_outlined,
      'What we collect',
      'Your account details (name, email and contact number), the readings '
          'from your Smart Cap (heart rate, body temperature and motion), '
          'your location while on duty, and the videos you record in the app.',
    ),
    (
      Icons.insights_rounded,
      'How we use it',
      'Readings and location are used to monitor your safety, to raise '
          'automatic and manual SOS alerts, and to guide responders to you. '
          'Recordings are kept as a record of incidents.',
    ),
    (
      Icons.visibility_outlined,
      'Who can see it',
      'Only you and the authorized administrators of your station. Your '
          'data is never sold or shared for advertising.',
    ),
    (
      Icons.schedule_rounded,
      'How long we keep it',
      'Vitals and location history are kept while your account is active. '
          'You may ask your administrator to delete your account and its '
          'data at any time.',
    ),
    (
      Icons.tune_rounded,
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
      subtitle: 'How CAPartner handles your data',
      actions: AccountPrimaryButton(
        label: 'Acknowledge',
        icon: Icons.check_rounded,
        onPressed: () => Navigator.of(context).pop(),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildSummary(),
            const SizedBox(height: 24),
            const AccountSectionTitle('THE DETAILS'),
            for (final (icon, heading, body) in _sections) ...[
              _buildSection(icon, heading, body),
              const SizedBox(height: 12),
            ],
          ],
        ),
      ),
    );
  }

  /// The policy in one sentence, on mint so it reads first.
  Widget _buildSummary() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.paleMint,
        border: Border.all(color: AppColors.mint, width: 1.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              color: AppColors.green,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.shield_outlined,
              size: 24,
              color: AppColors.white,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'In short',
                  style: appTextStyle(
                    fontSize: 12,
                    lineHeight: 16,
                    weight: FontWeight.w800,
                    color: AppColors.green,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  summary,
                  style: appTextStyle(
                    fontSize: 14,
                    lineHeight: 21,
                    weight: FontWeight.w700,
                    color: AppColors.darkGreen,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(IconData icon, String heading, String body) {
    return AccountCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.green.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: AppColors.green),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  heading,
                  style: appTextStyle(
                    fontSize: 15,
                    lineHeight: 20,
                    weight: FontWeight.w800,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  body,
                  style: appTextStyle(
                    fontSize: 13.5,
                    lineHeight: 20,
                    weight: FontWeight.w500,
                    color: AppColors.bodyText,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
