import 'package:flutter/material.dart';

/// Colour tokens from the CAPartner Figma file.
abstract final class AppColors {
  static const Color darkGreen = Color(0xFF053D1C);
  static const Color white = Color(0xFFFFFFFF);
  static const Color grey = Color(0xFF777777);
  static const Color greyGreen = Color(0xFF6C726D);

  static const Color green = Color(0xFF006E33);
  static const Color red = Color(0xFFD00000);
  static const Color mint = Color(0xFFE4F0E9);
  static const Color paleMint = Color(0xFFF0F7F3);
  static const Color ink = Color(0xFF1A1A1A);
  static const Color bodyText = Color(0xFF424742);
  static const Color mutedText = Color(0xFF6C726C);
  static const Color outline = Color(0xFFDFE3DF);
  static const Color surfaceGrey = Color(0xFFF7F8F7);

  /// Cap battery and readings that need attention.
  static const Color amber = Color(0xFFE2A600);

  /// Validation messages; the Figma file has no error colour yet.
  static const Color error = Color(0xFFB3261E);
}
