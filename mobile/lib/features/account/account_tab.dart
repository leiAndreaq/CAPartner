import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/features/account/account_widgets.dart';
import 'package:capartner/features/account/edit_profile_screen.dart';
import 'package:capartner/features/account/privacy_policy_screen.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Account tab: the user's profile, their Smart Cap, the privacy policy and
/// logging out.
///
/// Battery and connection details come from the cap's readings, and show
/// "--" until it has sent one.
class AccountTab extends StatelessWidget {
  const AccountTab({
    super.key,
    required this.statusBar,
    required this.profile,
    required this.capName,
    required this.capId,
    required this.capBattery,
    required this.capConnected,
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

  /// Battery level of the cap, 0 to 100; null until it reports one.
  final int? capBattery;

  /// Whether the cap has sent readings.
  final bool capConnected;

  String get _batteryText => capBattery == null ? '--' : '$capBattery%';
  double get _batteryFraction => (capBattery ?? 0) / 100;

  final SaveProfileCallback? onSaveProfile;
  final VoidCallback? onChangePairing;
  final VoidCallback? onLogout;

  static const double _horizontalPadding = 20;
  static const double _cardRadius = 20;

  static const List<BoxShadow> _cardShadow = [
    BoxShadow(color: Color(0x141A1A1A), offset: Offset(0, 6), blurRadius: 16),
  ];

  /// Up to two initials from the user's name, e.g. "JD".
  String get _initials => profile.name
      .trim()
      .split(RegExp(r'\s+'))
      .where((word) => word.isNotEmpty)
      .take(2)
      .map((word) => word[0].toUpperCase())
      .join();

  void _editProfile(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) =>
            EditProfileScreen(profile: profile, onSave: onSaveProfile),
      ),
    );
  }

  void _openPolicy(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => const PrivacyPolicyScreen()),
    );
  }

  void _showBattery(BuildContext context) {
    showInfoSheet(
      context,
      title: 'Cap Battery',
      header: Column(
        children: [
          Text(
            _batteryText,
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
              value: _batteryFraction,
              minHeight: 12,
              color: AppColors.amber,
              backgroundColor: AppColors.outline,
            ),
          ),
        ],
      ),
      rows: [('Device', capName)],
    );
  }

  void _showConnection(BuildContext context) {
    showInfoSheet(
      context,
      title: 'Connection',
      rows: [
        ('Device', capName),
        ('Bluetooth', capConnected ? 'Connected' : 'No data yet'),
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
          padding: const EdgeInsets.symmetric(horizontal: _horizontalPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'ACCOUNT',
                style: appTextStyle(
                  fontSize: 20,
                  lineHeight: 26,
                  weight: FontWeight.w900,
                  color: AppColors.darkGreen,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'Your profile, Smart Cap and privacy',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: appTextStyle(
                  fontSize: 13,
                  lineHeight: 18,
                  weight: FontWeight.w500,
                  color: AppColors.mutedText,
                ),
              ),
              const SizedBox(height: 16),
              _buildProfileCard(context),
              const SizedBox(height: 24),
              _buildSectionTitle('SMART CAP'),
              _buildCard(
                child: Column(
                  children: [
                    _buildCapSummary(),
                    const Divider(height: 1, color: AppColors.outline),
                    _buildRow(
                      icon: Icons.battery_5_bar_rounded,
                      iconColor: AppColors.amber,
                      label: 'Battery',
                      value: _batteryText,
                      onTap: () => _showBattery(context),
                    ),
                    _buildRowDivider(),
                    _buildRow(
                      icon: Icons.bluetooth_connected_rounded,
                      label: 'Connection',
                      value: 'Connected',
                      onTap: () => _showConnection(context),
                    ),
                    _buildRowDivider(),
                    _buildRow(
                      icon: Icons.swap_horiz_rounded,
                      label: 'Manage Pairing',
                      value: capName,
                      onTap: () => _managePairing(context),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              _buildSectionTitle('PRIVACY'),
              _buildCard(child: _buildPrivacy(context)),
              const SizedBox(height: 28),
              _buildLogOutButton(context),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 10),
      child: Text(
        text,
        style: appTextStyle(
          fontSize: 12,
          lineHeight: 16,
          weight: FontWeight.w800,
          color: AppColors.mutedText,
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(_cardRadius),
        boxShadow: _cardShadow,
      ),
      child: Material(
        color: AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(_cardRadius),
          side: const BorderSide(color: AppColors.outline),
        ),
        clipBehavior: Clip.antiAlias,
        child: child,
      ),
    );
  }

  /// The user, on dark green so it leads the page.
  Widget _buildProfileCard(BuildContext context) {
    final hasName = profile.name.isNotEmpty;
    final initials = _initials;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.darkGreen,
        borderRadius: BorderRadius.circular(_cardRadius + 4),
        boxShadow: [
          BoxShadow(
            color: AppColors.darkGreen.withValues(alpha: 0.3),
            offset: const Offset(0, 10),
            blurRadius: 24,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 64,
                height: 64,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.mint,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.white.withValues(alpha: 0.35),
                    width: 3,
                  ),
                ),
                child: initials.isEmpty
                    ? const Icon(
                        Icons.person_rounded,
                        size: 32,
                        color: AppColors.darkGreen,
                      )
                    : ExcludeSemantics(
                        child: Text(
                          initials,
                          style: appTextStyle(
                            fontSize: 22,
                            weight: FontWeight.w900,
                            color: AppColors.darkGreen,
                          ),
                        ),
                      ),
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
                        fontSize: 18,
                        lineHeight: 24,
                        weight: FontWeight.w900,
                        color: hasName
                            ? AppColors.white
                            : AppColors.white.withValues(alpha: 0.75),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(50),
                      ),
                      child: Text(
                        capId,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: appTextStyle(
                          fontSize: 10,
                          lineHeight: 15,
                          weight: FontWeight.w700,
                          color: AppColors.mint,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildContactLine(Icons.mail_outline_rounded, profile.email),
          if (profile.contactNumber.isNotEmpty) ...[
            const SizedBox(height: 6),
            _buildContactLine(Icons.call_outlined, profile.contactNumber),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.white,
                foregroundColor: AppColors.darkGreen,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () => _editProfile(context),
              icon: const Icon(Icons.edit_rounded, size: 18),
              label: Text(
                'Edit Profile',
                style: appTextStyle(
                  fontSize: 14,
                  weight: FontWeight.w800,
                  color: AppColors.darkGreen,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactLine(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.mint),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: appTextStyle(
              fontSize: 13,
              lineHeight: 18,
              weight: FontWeight.w600,
              color: AppColors.white,
            ),
          ),
        ),
      ],
    );
  }

  /// The paired cap at a glance: its name, that it is online, and how much
  /// battery it has left.
  Widget _buildCapSummary() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: AppColors.green,
                  shape: BoxShape.circle,
                ),
                child: SvgPicture.asset(
                  'assets/icons/cap_white.svg',
                  width: 24,
                  height: 24,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      capName,
                      style: appTextStyle(
                        fontSize: 16,
                        lineHeight: 22,
                        weight: FontWeight.w900,
                        color: AppColors.ink,
                      ),
                    ),
                    Text(
                      'Paired Smart Cap',
                      style: appTextStyle(
                        fontSize: 12,
                        lineHeight: 16,
                        weight: FontWeight.w500,
                        color: AppColors.mutedText,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.fromLTRB(8, 4, 10, 4),
                decoration: BoxDecoration(
                  color: AppColors.mint,
                  borderRadius: BorderRadius.circular(50),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: AppColors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Online',
                      style: appTextStyle(
                        fontSize: 11,
                        lineHeight: 15,
                        weight: FontWeight.w800,
                        color: AppColors.green,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Semantics(
            label: 'Cap battery $_batteryText',
            child: ExcludeSemantics(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(50),
                child: LinearProgressIndicator(
                  value: _batteryFraction,
                  minHeight: 6,
                  color: AppColors.amber,
                  backgroundColor: AppColors.outline,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRowDivider() {
    return const Divider(
      height: 1,
      indent: 64,
      endIndent: 16,
      color: AppColors.outline,
    );
  }

  Widget _buildIconBadge(IconData icon, Color color) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(icon, size: 20, color: color),
    );
  }

  Widget _buildRow({
    required IconData icon,
    required String label,
    required String value,
    required VoidCallback onTap,
    Color iconColor = AppColors.green,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 10, 12),
        child: Row(
          children: [
            _buildIconBadge(icon, iconColor),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: appTextStyle(
                  fontSize: 15,
                  lineHeight: 20,
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
                lineHeight: 18,
                weight: FontWeight.w600,
                color: AppColors.mutedText,
              ),
            ),
            const SizedBox(width: 2),
            const Icon(
              Icons.chevron_right_rounded,
              size: 22,
              color: AppColors.mutedText,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrivacy(BuildContext context) {
    return InkWell(
      onTap: () => _openPolicy(context),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildIconBadge(Icons.privacy_tip_rounded, AppColors.green),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Your data',
                    style: appTextStyle(
                      fontSize: 15,
                      lineHeight: 20,
                      weight: FontWeight.w700,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    PrivacyPolicyScreen.summary,
                    style: appTextStyle(
                      fontSize: 13,
                      lineHeight: 19,
                      weight: FontWeight.w500,
                      color: AppColors.bodyText,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Read Full Policy',
                        style: appTextStyle(
                          fontSize: 13,
                          lineHeight: 18,
                          weight: FontWeight.w800,
                          color: AppColors.green,
                        ),
                      ),
                      const Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: AppColors.green,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogOutButton(BuildContext context) {
    return SizedBox(
      height: 52,
      child: OutlinedButton.icon(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.red,
          backgroundColor: AppColors.red.withValues(alpha: 0.06),
          side: BorderSide(color: AppColors.red.withValues(alpha: 0.5)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        onPressed: () => _logOut(context),
        icon: const Icon(Icons.logout_rounded, size: 20),
        label: Text(
          'Log out',
          style: appTextStyle(
            fontSize: 15,
            weight: FontWeight.w800,
            color: AppColors.red,
          ),
        ),
      ),
    );
  }
}
