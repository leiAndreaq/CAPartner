import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/theme/app_colors.dart';

/// Splash screen (Figma node 482:2).
///
/// The whole screen is tappable in the design; [onContinue] is called on tap.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key, this.onContinue});

  final VoidCallback? onContinue;

  // Offsets below are taken from the 390x844 Figma frame, relative to the top
  // of the logo (y = 260). The texts overlap the logo's transparent padding.
  static const double _logoSize = 243;
  static const double _titleTop = 229;
  static const double _taglineTop = 265;
  static const double _lineHeight = 43.5;
  static const double _contentHeight = _taglineTop + _lineHeight;

  // Places the content block 260px from the top on an 844px tall frame.
  static const Alignment _contentAlignment = Alignment(0, -0.029);

  static const TextStyle _baseTextStyle = TextStyle(
    fontFamily: 'Inter',
    color: AppColors.white,
    letterSpacing: -0.725,
    leadingDistribution: TextLeadingDistribution.even,
    fontFeatures: [FontFeature('dlig')],
  );

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.darkGreen,
        body: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onContinue,
          child: Align(
            alignment: _contentAlignment,
            child: SizedBox(
              width: double.infinity,
              height: _contentHeight,
              child: Stack(
                alignment: Alignment.topCenter,
                children: [
                  Image.asset(
                    'assets/images/cap_logo.png',
                    width: _logoSize,
                    height: _logoSize,
                    fit: BoxFit.cover,
                    semanticLabel: 'CAPartner logo',
                  ),
                  Positioned(
                    top: _titleTop,
                    left: 0,
                    right: 0,
                    child: Text(
                      'CAPartner',
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      style: _baseTextStyle.copyWith(
                        fontSize: 40,
                        height: _lineHeight / 40,
                        fontWeight: FontWeight.w800,
                        fontVariations: const [FontVariation.weight(800)],
                      ),
                    ),
                  ),
                  Positioned(
                    top: _taglineTop,
                    left: 0,
                    right: 0,
                    child: Text(
                      'CAPartner sa Kalusugan, CAPartner sa Kaligtasan.',
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      style: _baseTextStyle.copyWith(
                        fontSize: 12,
                        height: _lineHeight / 12,
                        fontWeight: FontWeight.w600,
                        fontVariations: const [FontVariation.weight(600)],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
