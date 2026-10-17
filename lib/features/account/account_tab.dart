import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/features/account/account_widgets.dart';
import 'package:capartner/features/account/edit_profile_screen.dart';
import 'package:capartner/features/account/privacy_policy_screen.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Account tab: the user's profile, their Smart Cap, the privacy policy and
/// logging out.
///
/// Battery and connection details are fixed sample values until the cap
/// sends real data.
class AccountTab extends StatelessWidget {
  const AccountTab({
    super.key,
    required this.statusBar,
    required this.profile,
    required this.capName,
    required this.capId,
    required this.capBattery,
    this.onSaveProfile,
    this.onChangePairing,
    this.onLogout,
  });

  /// Connection status pill shown at the top.
  final Widget statusBar;
  final UserProfile profile;

  /// Name of the paired Smart Cap, e.g. "CAP-001".
  final String capName;

  /// ID line of the paired cap, as shown in the header.
  final String capId;

  /// Battery level of the cap, 0 to 100.
  final int capBattery;

  final SaveProfileCallback? onSaveProfile;
  final VoidCallback? onChangePairing;
  final VoidCallback? onLogout;

  static const List<BoxShadow> _shadow = [
    BoxShadow(color: Color(0x401A1A1A), offset: Offset(0, 8), blurRadius: 12),
    BoxShadow(color: Color(0x0F1A1A1A), offset: Offset(0, 1), blurRadius: 1),
  ];

  void _editProfile(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) =>
            EditProfileScreen(profile: profile, onSave: onSaveProfile),
      ),
    );
  }

  void _showBattery(BuildContext context) {
    showInfoSheet(
      context,
      title: 'Cap Battery',
      header: Column(
        children: [
          Text(
            '$capBattery%',
            style: appTextStyle(
              fontSize: 38,
              weight: FontWeight.w900,
              color: AppColors.ink,
              letterSpacing: -1.9,
            ),
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(50),
            child: LinearProgressIndicator(
              value: capBattery / 100,
              minHeight: 12,
              color: const Color(0xFFE2A600),
              backgroundColor: AppColors.outline,
            ),
          ),
        ],
      ),
      rows: [
        ('Device', capName),
        const ('Status', 'Not charging'),
        const ('Estimated time left', 'About 5 hours'),
      ],
    );
  }

  void _showConnection(BuildContext context) {
    showInfoSheet(
      context,
      title: 'Connection',
      rows: [
        ('Device', capName),
        const ('Bluetooth', 'Connected · Strong'),
        const ('Cellular', 'Disconnected'),
        const ('LoRa relay', 'Standby'),
      ],
    );
  }

  Future<void> _managePairing(BuildContext context) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Change paired cap?',
      message:
          '$capName stays connected until you finish pairing another Smart '
          'Cap.',
      confirmLabel: 'Change Pairing',
    );
    if (confirmed) onChangePairing?.call();
  }

  Future<void> _logOut(BuildContext context) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Log out?',
      message: 'You will need your email and password to log in again.',
      confirmLabel: 'Log out',
    );
    if (confirmed) onLogout?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 10),
        statusBar,
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 21),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'ACCOUNT',
                style: appTextStyle(
                  fontSize: 20,
                  lineHeight: 28,
                  weight: FontWeight.w900,
                  color: AppColors.darkGreen,
                ),
              ),
              const SizedBox(height: 12),
              _buildProfileCard(context),
              const SizedBox(height: 22),
              _buildSectionTitle('Smart Cap'),
              _buildCard(
                child: Column(
                  children: [
                    _buildRow(
                      icon: Image.asset(
                        'assets/images/battery.png',
                        width: 20,
                        height: 20,
                      ),
                      label: 'Battery',
                      value: '$capBattery%',
                      onTap: () => _showBattery(context),
                    ),
                    const Divider(height: 1, color: AppColors.outline),
                    _buildRow(
                      icon: SvgPicture.asset(
                        'assets/icons/bluetooth_status.svg',
                        width: 20,
                        height: 20,
                      ),
                      label: 'Connection',
                      value: 'Connected',
                      onTap: () => _showConnection(context),
                    ),
                    const Divider(height: 1, color: AppColors.outline),
                    _buildRow(
                      icon: SvgPicture.asset(
                        'assets/icons/cap_grey.svg',
                        width: 20,
                        height: 20,
                      ),
                      label: 'Manage Pairing',
                      value: capName,
                      onTap: () => _managePairing(context),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              _buildSectionTitle('Privacy Policy'),
              _buildCard(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        PrivacyPolicyScreen.summary,
                        style: appTextStyle(
                          fontSize: 13,
                          lineHeight: 19.5,
                          weight: FontWeight.w500,
                          color: AppColors.bodyText,
                        ),
                      ),
                      const SizedBox(height: 4),
                      _buildLink(
                        label: 'Read Full Policy',
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(
                            builder: (_) => const PrivacyPolicyScreen(),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),
              AuthButton(
                label: 'Log out',
                color: AppColors.red,
                onPressed: () => _logOut(context),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        text,
        style: appTextStyle(
          fontSize: 14,
          lineHeight: 20,
          weight: FontWeight.w800,
          color: const Color(0xFF8E8E8E),
        ),
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      width: double.infinity,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: _shadow,
      ),
      child: Material(type: MaterialType.transparency, child: child),
    );
  }

  Widget _buildProfileCard(BuildContext context) {
    final hasName = profile.name.isNotEmpty;

    return _buildCard(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Image.asset(
              'assets/images/test_account.png',
              width: 64,
              height: 64,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hasName ? profile.name : 'No name yet',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: appTextStyle(
                      fontSize: 17,
                      lineHeight: 23.375,
                      weight: FontWeight.w800,
                      color: hasName ? AppColors.ink : AppColors.mutedText,
                    ),
                  ),
                  Text(
                    profile.email,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: appTextStyle(
                      fontSize: 13,
                      lineHeight: 19.5,
                      weight: FontWeight.w500,
                      color: AppColors.bodyText,
                    ),
                  ),
                  if (profile.contactNumber.isNotEmpty)
                    Text(
                      profile.contactNumber,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: appTextStyle(
                        fontSize: 13,
                        lineHeight: 19.5,
                        weight: FontWeight.w500,
                        color: AppColors.bodyText,
                      ),
                    ),
                  Text(
                    capId,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: appTextStyle(
                      fontSize: 10,
                      lineHeight: 19.5,
                      weight: FontWeight.w400,
                      color: AppColors.darkGreen,
                    ),
                  ),
                  _buildLink(
                    label: 'Edit Profile',
                    onTap: () => _editProfile(context),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLink({required String label, required VoidCallback onTap}) {
    return Semantics(
      button: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Text(
            label,
            style:
                appTextStyle(
                  fontSize: 13,
                  lineHeight: 19.5,
                  weight: FontWeight.w800,
                  color: AppColors.green,
                ).copyWith(
                  decoration: TextDecoration.underline,
                  decorationColor: AppColors.green,
                ),
          ),
        ),
      ),
    );
  }

  Widget _buildRow({
    required Widget icon,
    required String label,
    required String value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: AppColors.mint,
                borderRadius: BorderRadius.circular(8),
              ),
              child: icon,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: appTextStyle(
                  fontSize: 15,
                  lineHeight: 22.5,
                  weight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              value,
              style: appTextStyle(
                fontSize: 13,
                lineHeight: 19.5,
                weight: FontWeight.w600,
                color: AppColors.mutedText,
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.mutedText),
          ],
        ),
      ),
    );
  }
}
