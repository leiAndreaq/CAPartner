import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:latlong2/latlong.dart' show LatLng;

import 'package:capartner/features/dashboard/vital_detail_screen.dart';
import 'package:capartner/features/dashboard/vitals.dart';
import 'package:capartner/features/map/location_preview_map.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Dashboard tab: the cap's latest readings, in the style of the pairing
/// screens: the overall status, the heart rate on dark green, then the other
/// readings on light cards. Each reading opens its own detail screen.
///
/// A reading shows as "--" until the cap sends it.
class DashboardTab extends StatelessWidget {
  const DashboardTab({
    super.key,
    required this.statusBar,
    required this.location,
    required this.position,
    this.vitals = Vitals.empty,
    this.onSos,
    this.onOpenMap,
  });

  /// Connection status pill shown at the top.
  final Widget statusBar;

  /// Where the user is, shown on the location card.
  final String location;

  /// Where the user is, shown on the location card's map.
  final LatLng? position;

  final Vitals vitals;
  final VoidCallback? onSos;

  /// Called when the location card is tapped, to show the full map.
  final VoidCallback? onOpenMap;

  static const double _horizontalPadding = 20;
  static const double _cardRadius = 20;

  static const List<BoxShadow> _cardShadow = [
    BoxShadow(color: Color(0x141A1A1A), offset: Offset(0, 6), blurRadius: 16),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 10),
        statusBar,
        Padding(
          padding: const EdgeInsets.fromLTRB(
            _horizontalPadding,
            20,
            _horizontalPadding,
            0,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildTitleRow(),
              const SizedBox(height: 16),
              _buildSummaryBanner(),
              const SizedBox(height: 16),
              _buildHeartRateCard(context),
              const SizedBox(height: 16),
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 12,
                  children: [
                    Expanded(child: _buildTemperatureCard(context)),
                    Expanded(child: _buildMotionCard(context)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              _buildLocationCard(),
            ],
          ),
        ),
      ],
    );
  }

  void _open(BuildContext context, Widget screen) {
    Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => screen));
  }

  Widget _buildTitleRow() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'DASHBOARD',
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
                'Live readings from your Smart Cap',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: appTextStyle(
                  fontSize: 13,
                  lineHeight: 18,
                  weight: FontWeight.w500,
                  color: AppColors.mutedText,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        _buildSosButton(),
      ],
    );
  }

  Widget _buildSosButton() {
    return Semantics(
      button: true,
      label: 'SOS',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onSos,
        child: Container(
          width: 56,
          height: 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.red,
            shape: BoxShape.circle,
            border: Border.all(
              color: AppColors.white.withValues(alpha: 0.6),
              width: 3,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.red.withValues(alpha: 0.35),
                offset: const Offset(0, 6),
                blurRadius: 14,
              ),
            ],
          ),
          child: ExcludeSemantics(
            child: Text(
              'SOS',
              style: appTextStyle(
                fontSize: 15,
                weight: FontWeight.w900,
                color: AppColors.white,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// The wearer's overall status and why.
  Widget _buildSummaryBanner() {
    final status = vitals.overall;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: status.color.withValues(alpha: 0.08),
        border: Border.all(
          color: status.color.withValues(alpha: 0.35),
          width: 1.5,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: status.color,
              shape: BoxShape.circle,
            ),
            child: Icon(status.icon, size: 24, color: AppColors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'OVERALL STATUS',
                  style: appTextStyle(
                    fontSize: 10,
                    lineHeight: 14,
                    weight: FontWeight.w800,
                    color: AppColors.mutedText,
                    letterSpacing: 1,
                  ),
                ),
                Text(
                  status.label,
                  style: appTextStyle(
                    fontSize: 18,
                    lineHeight: 24,
                    weight: FontWeight.w900,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  vitals.overallReason,
                  style: appTextStyle(
                    fontSize: 12,
                    lineHeight: 16,
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

  /// Rounded, tappable surface with a ripple.
  Widget _buildTappable({
    required String label,
    required Color color,
    required double radius,
    required VoidCallback onTap,
    required Widget child,
    List<BoxShadow>? shadow,
    BoxBorder? border,
  }) {
    return Semantics(
      button: true,
      label: label,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(radius),
          boxShadow: shadow,
        ),
        child: Material(
          color: color,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
            side: border is Border ? border.top : BorderSide.none,
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(onTap: onTap, child: child),
        ),
      ),
    );
  }

  /// The main reading, on dark green so it stands out from the rest.
  Widget _buildHeartRateCard(BuildContext context) {
    return _buildTappable(
      label: 'Heart rate details',
      color: AppColors.darkGreen,
      radius: _cardRadius + 4,
      shadow: [
        BoxShadow(
          color: AppColors.darkGreen.withValues(alpha: 0.3),
          offset: const Offset(0, 10),
          blurRadius: 24,
        ),
      ],
      onTap: () => _open(context, HeartRateScreen(vitals: vitals)),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildIconBadge(
                  Icons.favorite_rounded,
                  background: AppColors.white.withValues(alpha: 0.12),
                  foreground: AppColors.white,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Heart Rate',
                    style: appTextStyle(
                      fontSize: 15,
                      lineHeight: 20,
                      weight: FontWeight.w800,
                      color: AppColors.white,
                    ),
                  ),
                ),
                VitalStatusPill(status: vitals.heartRateStatus, onDark: true),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  vitals.heartRateText,
                  style: appTextStyle(
                    fontSize: 64,
                    lineHeight: 64,
                    weight: FontWeight.w900,
                    color: AppColors.white,
                    letterSpacing: -3,
                  ),
                ),
                const SizedBox(width: 10),
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Text(
                    'BPM',
                    style: appTextStyle(
                      fontSize: 16,
                      lineHeight: 20,
                      weight: FontWeight.w800,
                      color: AppColors.white.withValues(alpha: 0.7),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 40,
              width: double.infinity,
              child: SvgPicture.asset(
                'assets/icons/ecg.svg',
                fit: BoxFit.fill,
                colorFilter: const ColorFilter.mode(
                  AppColors.mint,
                  BlendMode.srcIn,
                ),
              ),
            ),
            const SizedBox(height: 14),
            _buildRangeBar(),
            const SizedBox(height: 12),
            _buildDetailsLink(onDark: true),
          ],
        ),
      ),
    );
  }

  /// Where the heart rate sits within the resting range.
  Widget _buildRangeBar() {
    // The bar spans 40–140 BPM so the resting range sits in its middle.
    const low = 40;
    const high = 140;
    double at(int bpm) => ((bpm - low) / (high - low)).clamp(0.0, 1.0);
    final heartRate = vitals.heartRate;

    final labelStyle = appTextStyle(
      fontSize: 11,
      lineHeight: 14,
      weight: FontWeight.w600,
      color: AppColors.white.withValues(alpha: 0.7),
    );

    return Semantics(
      label: 'Resting range ${Vitals.restingLow} to ${Vitals.restingHigh} BPM',
      child: ExcludeSemantics(
        child: Column(
          children: [
            LayoutBuilder(
              builder: (context, constraints) {
                final width = constraints.maxWidth;
                return SizedBox(
                  height: 12,
                  child: Stack(
                    children: [
                      Positioned(
                        left: 0,
                        right: 0,
                        top: 4,
                        height: 4,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: AppColors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      Positioned(
                        left: width * at(Vitals.restingLow),
                        width:
                            width *
                            (at(Vitals.restingHigh) - at(Vitals.restingLow)),
                        top: 4,
                        height: 4,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: AppColors.mint,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      if (heartRate != null)
                        Positioned(
                          left: width * at(heartRate) - 6,
                          top: 0,
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: AppColors.white,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.green,
                                width: 2.5,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Resting range '
                    '${Vitals.restingLow}–${Vitals.restingHigh}',
                    style: labelStyle,
                  ),
                ),
                Text(
                  heartRate == null ? 'No data yet' : 'Updated 2s ago',
                  style: labelStyle,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  /// "View details" with a chevron, at the foot of each reading card.
  Widget _buildDetailsLink({bool onDark = false}) {
    final color = onDark ? AppColors.white : AppColors.green;
    return FittedBox(
      fit: BoxFit.scaleDown,
      alignment: Alignment.centerLeft,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'View details',
            style: appTextStyle(
              fontSize: 12,
              lineHeight: 16,
              weight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(width: 2),
          Icon(Icons.chevron_right_rounded, size: 18, color: color),
        ],
      ),
    );
  }

  Widget _buildIconBadge(
    IconData icon, {
    Color background = AppColors.mint,
    Color foreground = AppColors.green,
  }) {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(icon, size: 20, color: foreground),
    );
  }

  /// Icon and title, the value and its word, the status, then the link.
  Widget _buildReadingCard({
    required String semanticsLabel,
    required IconData icon,
    required String title,
    required Widget value,
    required String detail,
    required VitalStatus status,
    required VoidCallback onTap,
  }) {
    return _buildTappable(
      label: semanticsLabel,
      color: AppColors.white,
      radius: _cardRadius,
      shadow: _cardShadow,
      border: Border.all(color: AppColors.outline),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildIconBadge(icon),
            const SizedBox(height: 12),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                title,
                maxLines: 1,
                style: appTextStyle(
                  fontSize: 13,
                  lineHeight: 18,
                  weight: FontWeight.w700,
                  color: AppColors.mutedText,
                ),
              ),
            ),
            const SizedBox(height: 4),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: value,
            ),
            Text(
              detail,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: appTextStyle(
                fontSize: 12,
                lineHeight: 16,
                weight: FontWeight.w600,
                color: AppColors.bodyText,
              ),
            ),
            const Spacer(),
            const SizedBox(height: 12),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: VitalStatusPill(status: status),
            ),
            const SizedBox(height: 10),
            _buildDetailsLink(),
          ],
        ),
      ),
    );
  }

  Widget _buildTemperatureCard(BuildContext context) {
    return _buildReadingCard(
      semanticsLabel: 'Body temperature details',
      icon: Icons.thermostat_rounded,
      title: 'Body Temperature',
      detail: vitals.temperatureLabel,
      status: vitals.temperatureStatus,
      onTap: () => _open(context, TemperatureScreen(vitals: vitals)),
      value: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            vitals.bodyTemperatureText,
            style: appTextStyle(
              fontSize: 32,
              lineHeight: 38,
              weight: FontWeight.w900,
              color: AppColors.ink,
              letterSpacing: -1.2,
            ),
          ),
          const SizedBox(width: 3),
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              '°C',
              style: appTextStyle(
                fontSize: 16,
                lineHeight: 20,
                weight: FontWeight.w800,
                color: AppColors.mutedText,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMotionCard(BuildContext context) {
    return _buildReadingCard(
      semanticsLabel: 'Motion details',
      icon: vitals.motion?.icon ?? Icons.directions_walk_rounded,
      title: 'Motion Status',
      detail: vitals.motion == null
          ? 'No reading yet'
          : 'For ${vitals.stillMinutes} min',
      status: vitals.motionStatus,
      onTap: () => _open(context, MotionScreen(vitals: vitals)),
      value: Text(
        vitals.motionText,
        style: appTextStyle(
          fontSize: 22,
          lineHeight: 38,
          weight: FontWeight.w900,
          color: AppColors.ink,
          letterSpacing: -0.5,
        ),
      ),
    );
  }

  Widget _buildLocationCard() {
    return _buildTappable(
      label: 'Open map',
      color: AppColors.white,
      radius: _cardRadius,
      shadow: _cardShadow,
      border: Border.all(color: AppColors.outline),
      onTap: () => onOpenMap?.call(),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: switch (position) {
                final position? => LocationPreviewMap(
                  position: position,
                  width: 84,
                  height: 72,
                ),
                null => Container(
                  width: 84,
                  height: 72,
                  color: AppColors.outline,
                  child: const Icon(
                    Icons.location_off_rounded,
                    color: AppColors.darkGreen,
                  ),
                ),
              },
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.place_rounded,
                        size: 16,
                        color: AppColors.green,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Your Location',
                        style: appTextStyle(
                          fontSize: 13,
                          lineHeight: 18,
                          weight: FontWeight.w700,
                          color: AppColors.mutedText,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    location,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: appTextStyle(
                      fontSize: 14,
                      lineHeight: 19,
                      weight: FontWeight.w800,
                      color: AppColors.ink,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'GPS active · updated 12s ago',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: appTextStyle(
                      fontSize: 12,
                      lineHeight: 16,
                      weight: FontWeight.w500,
                      color: AppColors.green,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.chevron_right_rounded,
              size: 22,
              color: AppColors.green,
            ),
          ],
        ),
      ),
    );
  }
}
