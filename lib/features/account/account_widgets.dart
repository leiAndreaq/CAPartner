import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Page opened from the Account tab: green header with a back button and a
/// title, and [child] scrolling below it.
class AccountPageScaffold extends StatelessWidget {
  const AccountPageScaffold({
    super.key,
    required this.title,
    required this.child,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.white,
        body: Column(
          children: [
            Container(
              height: 105,
              width: double.infinity,
              color: AppColors.darkGreen,
              child: Stack(
                children: [
                  Positioned(
                    top: 40,
                    left: 74,
                    right: 31,
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        title,
                        maxLines: 1,
                        style: authTextStyle(
                          color: AppColors.white,
                          fontSize: 32,
                          lineHeight: 43.5,
                          weight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: 9,
                    top: 31,
                    width: 65,
                    height: 42,
                    child: IconButton(
                      tooltip: 'Back',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.of(context).maybePop(),
                      icon: Image.asset(
                        'assets/images/back_arrow.png',
                        width: 42,
                        height: 42,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: SingleChildScrollView(child: child)),
          ],
        ),
      ),
    );
  }
}

/// Asks the user to confirm an action; resolves to true when they agree.
Future<bool> showConfirmDialog(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
  String cancelLabel = 'Cancel',
}) async {
  const text = Color(0xFF000000);
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => Dialog(
      backgroundColor: const Color(0xFFDFE5DB),
      insetPadding: const EdgeInsets.symmetric(horizontal: 35, vertical: 24),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(26),
        side: BorderSide(color: text.withValues(alpha: 0.2), width: 0.8),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                textAlign: TextAlign.center,
                style: appTextStyle(
                  fontSize: 18,
                  lineHeight: 28,
                  weight: FontWeight.w700,
                  color: text,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: appTextStyle(
                  fontSize: 14,
                  lineHeight: 20,
                  weight: FontWeight.w400,
                  color: text.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: 21),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.darkGreen,
                    foregroundColor: AppColors.white,
                    shape: const StadiumBorder(),
                    textStyle: appTextStyle(
                      fontSize: 14,
                      weight: FontWeight.w700,
                      color: AppColors.white,
                    ),
                  ),
                  child: Text(confirmLabel),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: text.withValues(alpha: 0.75),
                    shape: const StadiumBorder(),
                    side: BorderSide(
                      color: text.withValues(alpha: 0.25),
                      width: 0.8,
                    ),
                    textStyle: appTextStyle(
                      fontSize: 14,
                      weight: FontWeight.w700,
                      color: text,
                    ),
                  ),
                  child: Text(cancelLabel),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
  return confirmed ?? false;
}

/// Slides up a sheet titled [title] listing label/value [rows], with an
/// optional widget between the title and the rows.
Future<void> showInfoSheet(
  BuildContext context, {
  required String title,
  required List<(String, String)> rows,
  Widget? header,
}) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppColors.white,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(50)),
    ),
    builder: (context) => SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 15, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 62,
              height: 9,
              decoration: BoxDecoration(
                color: const Color(0xFFE7E7E7),
                borderRadius: BorderRadius.circular(50),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: appTextStyle(
                fontSize: 20,
                weight: FontWeight.w900,
                color: AppColors.darkGreen,
              ),
            ),
            const SizedBox(height: 16),
            if (header != null) ...[header, const SizedBox(height: 16)],
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.outline),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  for (var i = 0; i < rows.length; i++)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        border: i == 0
                            ? null
                            : const Border(
                                top: BorderSide(color: AppColors.outline),
                              ),
                      ),
                      child: Row(
                        children: [
                          Text(
                            rows[i].$1,
                            style: appTextStyle(
                              fontSize: 14,
                              lineHeight: 21,
                              weight: FontWeight.w600,
                              color: AppColors.bodyText,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              rows[i].$2,
                              textAlign: TextAlign.end,
                              style: appTextStyle(
                                fontSize: 15,
                                lineHeight: 22.5,
                                weight: FontWeight.w800,
                                color: AppColors.ink,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
