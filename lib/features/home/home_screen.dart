import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/features/account/account_tab.dart';
import 'package:capartner/features/account/edit_profile_screen.dart';
import 'package:capartner/features/alerts/alerts_tab.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/features/camera/camera_tab.dart';
import 'package:capartner/features/dashboard/dashboard_tab.dart';
import 'package:capartner/features/home/home_widgets.dart';
import 'package:capartner/features/map/map_tab.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Tabs of the bottom bar, left to right.
enum HomeTab {
  dashboard('Dashboard'),
  map('Map'),
  camera('Camera'),
  alerts('Alerts'),
  account('Account');

  const HomeTab(this.label);

  final String label;
}

/// Home of the app once logged in and paired (Figma node 546:564).
///
/// This is the frame around the tabs: header, status bar and tab bar. Readings
/// and locations are fixed sample values until the cap sends real data.
class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    this.capName = 'CAP-001',
    this.profile = const UserProfile(email: ''),
    this.onSos,
    this.onSaveProfile,
    this.onChangePassword,
    this.onChangePairing,
    this.onLogout,
  });

  /// Name of the paired Smart Cap.
  final String capName;

  /// The logged-in user, as it was when the screen opened.
  final UserProfile profile;
  final VoidCallback? onSos;
  final SaveProfileCallback? onSaveProfile;
  final VoidCallback? onChangePassword;
  final VoidCallback? onChangePairing;
  final VoidCallback? onLogout;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Sizes below are taken from the 390x844 Figma frame.
  static const double _tabBarHeight = 71;

  /// How far the camera button sticks out above the tab bar.
  static const double _cameraButtonRise = 21;

  // Sample readings.
  static const String _location = 'Vicas Market, Camarin Road';
  static const int _capBattery = 70;

  HomeTab _tab = HomeTab.dashboard;
  late UserProfile _profile = widget.profile;

  Future<String?> _saveProfile(UserProfile profile) async {
    final rejection = await widget.onSaveProfile?.call(profile);
    if (rejection == null && mounted) setState(() => _profile = profile);
    return rejection;
  }

  /// ID line of the user's own cap.
  String get _capId =>
      '${widget.capName.replaceAll('-', ' ')} - PSTMD-2026-084';

  String get _greeting {
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good Morning'
        : hour < 18
        ? 'Good Afternoon'
        : 'Good Evening';
    final firstName = _profile.name.trim().split(' ').first;
    return firstName.isEmpty ? '$greeting!' : '$greeting, $firstName!';
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.white,
        body: Stack(
          children: [
            Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: switch (_tab) {
                    HomeTab.dashboard => SingleChildScrollView(
                      padding: EdgeInsets.only(
                        bottom: _tabBarHeight + bottomInset + 27,
                      ),
                      child: DashboardTab(
                        statusBar: _buildStatusBar(),
                        location: _location,
                        onSos: widget.onSos,
                      ),
                    ),
                    HomeTab.map => MapTab(
                      statusBar: _buildStatusBar(),
                      capId: _capId,
                      bottomPadding: _tabBarHeight + bottomInset,
                    ),
                    HomeTab.camera => SingleChildScrollView(
                      padding: EdgeInsets.only(
                        bottom: _tabBarHeight + bottomInset + 27,
                      ),
                      child: CameraTab(
                        statusBar: _buildStatusBar(),
                        location: _location,
                      ),
                    ),
                    HomeTab.alerts => AlertsTab(
                      statusBar: _buildStatusBar(),
                      bottomPadding: _tabBarHeight + bottomInset,
                    ),
                    HomeTab.account => SingleChildScrollView(
                      padding: EdgeInsets.only(
                        bottom: _tabBarHeight + bottomInset + 27,
                      ),
                      child: AccountTab(
                        statusBar: _buildStatusBar(),
                        profile: _profile,
                        capName: widget.capName,
                        capId: _capId,
                        capBattery: _capBattery,
                        onSaveProfile: _saveProfile,
                        onChangePassword: widget.onChangePassword,
                        onChangePairing: widget.onChangePairing,
                        onLogout: widget.onLogout,
                      ),
                    ),
                  },
                ),
              ],
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: _buildTabBar(bottomInset),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      height: 93,
      color: AppColors.darkGreen,
      child: Stack(
        children: [
          Positioned(
            left: 18,
            right: 100,
            top: 39,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                _greeting,
                maxLines: 1,
                style: appTextStyle(
                  fontSize: 20,
                  lineHeight: 24,
                  weight: FontWeight.w900,
                  color: AppColors.white,
                ),
              ),
            ),
          ),
          Positioned(
            left: 20,
            right: 100,
            top: 65,
            child: Text(
              _capId,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: appTextStyle(
                fontSize: 10,
                lineHeight: 19.5,
                weight: FontWeight.w400,
                color: AppColors.white,
              ),
            ),
          ),
          Positioned(
            right: 17,
            top: 8,
            child: Image.asset(
              'assets/images/cap_logo.png',
              width: 77,
              height: 77,
              fit: BoxFit.cover,
              semanticLabel: 'CAPartner logo',
            ),
          ),
        ],
      ),
    );
  }

  /// Bluetooth, cellular and cap battery status.
  Widget _buildStatusBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: FittedBox(fit: BoxFit.scaleDown, child: _buildStatusPill()),
    );
  }

  Widget _buildStatusPill() {
    return Container(
      width: 373,
      height: 33,
      padding: const EdgeInsets.only(left: 10),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(50),
        boxShadow: const [
          BoxShadow(
            color: Color(0x40000000),
            offset: Offset(0, 8),
            blurRadius: 24,
            spreadRadius: -12,
          ),
          BoxShadow(
            color: Color(0x33000000),
            offset: Offset(0, 1),
            blurRadius: 6,
          ),
        ],
      ),
      child: Row(
        children: [
          SvgPicture.asset(
            'assets/icons/bluetooth_status.svg',
            width: 20,
            height: 20,
          ),
          const SizedBox(width: 5),
          StatusChip(
            label: 'CONNECTED',
            background: const Color(0x662AD400),
            foreground: AppColors.darkGreen,
          ),
          const SizedBox(width: 20),
          Image.asset(
            'assets/images/cellular_network.png',
            width: 20,
            height: 20,
          ),
          const SizedBox(width: 3),
          StatusChip(
            label: 'DISCONNECTED',
            background: const Color(0x66FF4343),
            foreground: const Color(0xFF3D0505),
          ),
          const SizedBox(width: 24),
          Image.asset('assets/images/battery.png', width: 20, height: 20),
          const SizedBox(width: 1),
          _buildBatteryBar(),
        ],
      ),
    );
  }

  Widget _buildBatteryBar() {
    const amber = Color(0xFFE2A600);
    return Semantics(
      label: 'Cap battery $_capBattery%',
      child: ExcludeSemantics(
        child: Container(
          width: 79,
          height: 17,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            border: Border.all(color: amber),
            borderRadius: BorderRadius.circular(50),
          ),
          child: Stack(
            children: [
              FractionallySizedBox(
                widthFactor: _capBattery / 100,
                heightFactor: 1,
                child: Container(
                  decoration: BoxDecoration(
                    color: amber,
                    borderRadius: BorderRadius.circular(50),
                  ),
                ),
              ),
              Center(
                child: Text(
                  '$_capBattery%',
                  style: appTextStyle(
                    fontSize: 8,
                    weight: FontWeight.w700,
                    color: AppColors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabBar(double bottomInset) {
    return SizedBox(
      height: _cameraButtonRise + _tabBarHeight + bottomInset,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            right: 0,
            top: _cameraButtonRise,
            bottom: 0,
            child: const DecoratedBox(
              decoration: BoxDecoration(
                color: AppColors.white,
                border: Border(top: BorderSide(color: Color(0xFFE4E4E4))),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final tab in HomeTab.values)
                  Expanded(child: _buildTabItem(tab)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabItem(HomeTab tab) {
    const inactive = Color(0xFF9CA3AF);
    final selected = tab == _tab;
    final color = selected ? AppColors.darkGreen : inactive;

    final Widget icon;
    if (tab == HomeTab.camera) {
      icon = Container(
        width: 56,
        height: 56,
        margin: const EdgeInsets.only(top: 1),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? AppColors.darkGreen : AppColors.white,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0x1A000000)),
        ),
        child: selected
            ? Image.asset('assets/images/video_call.png', width: 30, height: 30)
            : SvgPicture.asset(
                'assets/icons/camera.svg',
                width: 30,
                height: 30,
              ),
      );
    } else {
      icon = Padding(
        padding: const EdgeInsets.only(top: _cameraButtonRise + 11),
        child: Image.asset(
          switch (tab) {
            HomeTab.dashboard => 'assets/images/tab_dashboard.png',
            HomeTab.map => 'assets/images/tab_map.png',
            HomeTab.alerts => 'assets/images/tab_alerts.png',
            _ => 'assets/images/tab_account.png',
          },
          width: 30,
          height: 30,
          color: color,
        ),
      );
    }

    return Semantics(
      button: true,
      selected: selected,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => setState(() => _tab = tab),
        child: Column(
          children: [
            icon,
            SizedBox(height: tab == HomeTab.camera ? 4 : 0),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                tab.label,
                maxLines: 1,
                style: appTextStyle(
                  fontSize: 8.5,
                  lineHeight: 15,
                  weight: selected ? FontWeight.w900 : FontWeight.w600,
                  color: color,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
