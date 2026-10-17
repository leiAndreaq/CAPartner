import 'package:flutter/material.dart';

import 'package:capartner/theme/app_colors.dart';

/// Text style of the onboarding/auth screens, which set their type tight.
///
/// [lineHeight] is in logical pixels, as given in Figma.
TextStyle authTextStyle({
  required double fontSize,
  required FontWeight weight,
  double? lineHeight,
  Color color = AppColors.darkGreen,
  FontStyle? fontStyle,
}) {
  return TextStyle(
    fontFamily: 'Inter',
    color: color,
    fontSize: fontSize,
    height: lineHeight == null ? null : lineHeight / fontSize,
    fontWeight: weight,
    fontVariations: [FontVariation.weight(weight.value.toDouble())],
    fontStyle: fontStyle,
    letterSpacing: -0.725,
    leadingDistribution: TextLeadingDistribution.even,
    fontFeatures: const [FontFeature('dlig')],
  );
}

/// Text style of the pairing screens and the main tabs, which use normal
/// letter spacing unless a design says otherwise.
TextStyle appTextStyle({
  required double fontSize,
  required FontWeight weight,
  required Color color,
  double? lineHeight,
  double letterSpacing = 0,
}) {
  return authTextStyle(
    fontSize: fontSize,
    weight: weight,
    color: color,
    lineHeight: lineHeight,
  ).copyWith(letterSpacing: letterSpacing);
}
