import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Dashboard tab (Figma node 546:564): the cap's latest readings.
///
/// The readings are fixed sample values until the cap sends real data.
class DashboardTab extends StatelessWidget {
  const DashboardTab({
    super.key,
    required this.statusBar,
    required this.location,
    this.onSos,
  });

  /// Connection status pill shown at the top.
  final Widget statusBar;

  /// Where the user is, shown on the location card.
  final String location;
  final VoidCallback? onSos;

  // Sizes below are taken from the 390x844 Figma frame.
  static const double _horizontalPadding = 21;

  static const List<BoxShadow> _cardShadow = [
    BoxShadow(color: Color(0x401A1A1A), offset: Offset(0, 8), blurRadius: 12),
    BoxShadow(color: Color(0x0F1A1A1A), offset: Offset(0, 1), blurRadius: 1),
  ];

  // Sample readings.
  static const int _heartRate = 80;
  static const double _bodyTemperature = 38.3;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 10),
        statusBar,
        const SizedBox(height: 13),
        Padding(
          padding: const EdgeInsets.only(left: 24, right: 30),
          child: SizedBox(
            height: 40,
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'DASHBOARD',
                    style: appTextStyle(
                      fontSize: 20,
                      weight: FontWeight.w900,
                      color: AppColors.darkGreen,
                    ),
                  ),
                ),
                _buildSosButton(),
              ],
            ),
          ),
        ),
        const SizedBox(height: 13),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: _horizontalPadding),
          child: Column(
            children: [
              _buildHeartRateCard(),
              const SizedBox(height: 35),
              Row(
                spacing: 16,
                children: [
                  Expanded(child: _buildTemperatureCard()),
                  Expanded(child: _buildMotionCard()),
                ],
              ),
              const SizedBox(height: 22),
              _buildLocationCard(),
            ],
          ),
        ),
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
          width: 40,
          height: 40,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: Color(0xFFFF0004),
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Color(0x40000000),
                offset: Offset(0, 4),
                blurRadius: 4,
              ),
            ],
          ),
          child: ExcludeSemantics(
            child: Text(
              'SOS',
              style: appTextStyle(
                fontSize: 14,
                weight: FontWeight.w800,
                color: AppColors.white,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCard({required double height, required List<Widget> children}) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: _cardShadow,
      ),
      child: Stack(children: children),
    );
  }

  Widget _buildHeartRateCard() {
    return _buildCard(
      height: 244,
      children: [
        Positioned(
          left: 37,
          top: 25,
          child: Row(
            children: [
              SvgPicture.asset('assets/icons/heart.svg', width: 20, height: 20),
              const SizedBox(width: 8),
              Text(
                'Heart Rate',
                style: appTextStyle(
                  fontSize: 13,
                  lineHeight: 19.5,
                  weight: FontWeight.w800,
                  color: AppColors.green,
                  letterSpacing: 1.3,
                ),
              ),
            ],
          ),
        ),
        Positioned(
          right: 21,
          top: 22,
          child: Container(
            height: 30,
            padding: const EdgeInsets.only(left: 12, right: 20),
            decoration: BoxDecoration(
              color: AppColors.mint,
              borderRadius: BorderRadius.circular(15),
            ),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.green.withValues(alpha: 0.55),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 9),
                Text(
                  'Normal',
                  style: appTextStyle(
                    fontSize: 12,
                    weight: FontWeight.w900,
                    color: AppColors.green,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          left: 22,
          top: 64,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$_heartRate',
                style: appTextStyle(
                  fontSize: 76,
                  lineHeight: 76,
                  weight: FontWeight.w900,
                  color: AppColors.ink,
                  letterSpacing: -3.8,
                ),
              ),
              const SizedBox(width: 20),
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  'BPM',
                  style: appTextStyle(
                    fontSize: 19,
                    lineHeight: 28.5,
                    weight: FontWeight.w800,
                    color: const Color(0xFF5F6660),
                  ),
                ),
              ),
            ],
          ),
        ),
        Positioned(
          left: 27,
          right: 31,
          top: 147,
          height: 48,
          child: SvgPicture.asset('assets/icons/ecg.svg', fit: BoxFit.fill),
        ),
        Positioned(
          left: 12,
          right: 12,
          top: 207,
          child: Text(
            'Resting range 60–100 · updated 2s ago',
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: appTextStyle(
              fontSize: 13,
              lineHeight: 19.5,
              weight: FontWeight.w600,
              color: AppColors.bodyText,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTemperatureCard() {
    return _buildCard(
      height: 138,
      children: [
        Positioned(
          left: 22,
          top: 19,
          child: SvgPicture.asset(
            'assets/icons/thermometer.svg',
            width: 8.8,
            height: 17.6,
          ),
        ),
        Positioned(
          left: 35,
          right: 8,
          top: 18,
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              'Body Temperature',
              maxLines: 1,
              style: appTextStyle(
                fontSize: 12,
                lineHeight: 19.5,
                weight: FontWeight.w900,
                color: const Color(0xFFF5A623),
              ),
            ),
          ),
        ),
        Positioned(
          left: 12,
          right: 12,
          top: 51,
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Text(
                    '$_bodyTemperature',
                    style: appTextStyle(
                      fontSize: 38,
                      lineHeight: 38,
                      weight: FontWeight.w900,
                      color: AppColors.ink,
                      letterSpacing: -1.9,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  '°C',
                  style: appTextStyle(
                    fontSize: 20,
                    lineHeight: 24,
                    weight: FontWeight.w800,
                    color: AppColors.mutedText,
                    letterSpacing: -1.9,
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          top: 107,
          child: Text(
            'Normal',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 13,
              lineHeight: 19.5,
              weight: FontWeight.w700,
              color: const Color(0xFF8A5A05),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMotionCard() {
    const blue = Color(0xFF4979D1);
    return _buildCard(
      height: 138,
      children: [
        Positioned(
          left: 20,
          top: 16,
          child: Image.asset(
            'assets/images/staircase.png',
            width: 24,
            height: 17,
          ),
        ),
        Positioned(
          left: 48,
          right: 8,
          top: 16,
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              'Motion Status',
              maxLines: 1,
              style: appTextStyle(
                fontSize: 13,
                lineHeight: 19.5,
                weight: FontWeight.w900,
                color: blue,
              ),
            ),
          ),
        ),
        Positioned(
          left: 12,
          right: 12,
          top: 64,
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Row(
              children: [
                Container(
                  width: 15,
                  height: 15,
                  decoration: const BoxDecoration(
                    color: blue,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 9),
                Text(
                  'Stationary',
                  style: appTextStyle(
                    fontSize: 20,
                    lineHeight: 26,
                    weight: FontWeight.w900,
                    color: const Color(0xFF000000),
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          top: 108,
          child: Text(
            'Active',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 13,
              lineHeight: 19.5,
              weight: FontWeight.w700,
              color: blue,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLocationCard() {
    return _buildCard(
      height: 105,
      children: [
        Positioned(
          left: 8,
          top: 6,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: SvgPicture.asset(
              'assets/icons/map_thumbnail.svg',
              width: 110,
              height: 92,
            ),
          ),
        ),
        Positioned(
          left: 129,
          right: 12,
          top: 16,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Your Location',
                style: appTextStyle(
                  fontSize: 13,
                  lineHeight: 19.5,
                  weight: FontWeight.w900,
                  color: const Color(0xFF898989),
                ),
              ),
              const SizedBox(height: 5.5),
              Padding(
                padding: const EdgeInsets.only(left: 3),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      location,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: appTextStyle(
                        fontSize: 12,
                        lineHeight: 19.5,
                        weight: FontWeight.w700,
                        color: const Color(0xFF000000),
                      ),
                    ),
                    const SizedBox(height: 1.5),
                    Text(
                      'Active • updated 12s ago',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: appTextStyle(
                        fontSize: 12,
                        lineHeight: 19.5,
                        weight: FontWeight.w300,
                        color: AppColors.darkGreen,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
