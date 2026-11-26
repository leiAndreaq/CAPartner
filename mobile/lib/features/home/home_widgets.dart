import 'package:flutter/material.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Small rounded label such as "CONNECTED".
class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
    required this.background,
    required this.foreground,
  });

  /// Green "CONNECTED" chip.
  const StatusChip.connected({super.key})
    : label = 'CONNECTED',
      background = const Color(0x662AD400),
      foreground = AppColors.darkGreen;

  final String label;
  final Color background;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 79,
      height: 17,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(50),
      ),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Text(
          label,
          style: appTextStyle(
            fontSize: 8,
            weight: FontWeight.w700,
            color: foreground,
          ),
        ),
      ),
    );
  }
}
