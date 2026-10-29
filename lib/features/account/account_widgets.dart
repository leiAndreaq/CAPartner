import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Page opened from the Account tab: green header with a back button, a
/// title and an optional [subtitle], then [child] scrolling below it.
///
/// [actions] stay pinned to the bottom of the screen, above the keyboard.
class AccountPageScaffold extends StatelessWidget {
  const AccountPageScaffold({
    super.key,
    required this.title,
    required this.child,
    this.subtitle,
    this.actions,
  });

  final String title;
  final String? subtitle;
  final Widget child;
  final Widget? actions;

  @override
  Widget build(BuildContext context) {
    final subtitle = this.subtitle;
    final actions = this.actions;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: Column(
          children: [
            Container(
              width: double.infinity,
              color: AppColors.darkGreen,
              child: SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(8, 10, 20, 18),
                  child: Row(
                    children: [
                      IconButton(
                        tooltip: 'Back',
                        onPressed: () => Navigator.of(context).maybePop(),
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.white.withValues(
                            alpha: 0.12,
                          ),
                          foregroundColor: AppColors.white,
                        ),
                        icon: const Icon(Icons.arrow_back_rounded),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: appTextStyle(
                                fontSize: 20,
                                lineHeight: 26,
                                weight: FontWeight.w900,
                                color: AppColors.white,
                              ),
                            ),
                            if (subtitle != null)
                              Text(
                                subtitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: appTextStyle(
                                  fontSize: 12,
                                  lineHeight: 16,
                                  weight: FontWeight.w500,
                                  color: AppColors.white.withValues(
                                    alpha: 0.75,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Expanded(child: SingleChildScrollView(child: child)),
            if (actions != null)
              DecoratedBox(
                decoration: const BoxDecoration(
                  color: AppColors.white,
                  border: Border(top: BorderSide(color: AppColors.outline)),
                ),
                child: SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                    child: actions,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// White rounded card with a soft shadow, used on the Account pages.
class AccountCard extends StatelessWidget {
  const AccountCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
  });

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border.all(color: AppColors.outline),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x141A1A1A),
            offset: Offset(0, 6),
            blurRadius: 16,
          ),
        ],
      ),
      child: child,
    );
  }
}

/// Small uppercase heading above a group of cards.
class AccountSectionTitle extends StatelessWidget {
  const AccountSectionTitle(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
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
}

/// Full-width filled button in the app's dark green. While [busy] it shows a
/// spinner in place of its label.
class AccountPrimaryButton extends StatelessWidget {
  const AccountPrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.busy = false,
  });

  final String label;
  final VoidCallback onPressed;
  final IconData? icon;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final icon = this.icon;
    return SizedBox(
      height: 52,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.darkGreen,
          foregroundColor: AppColors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: busy
            ? SizedBox.square(
                dimension: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppColors.white,
                  semanticsLabel: label,
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(icon, size: 20),
                    const SizedBox(width: 8),
                  ],
                  // Shrinks rather than overflows with large system font sizes.
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        label,
                        maxLines: 1,
                        style: appTextStyle(
                          fontSize: 15,
                          weight: FontWeight.w800,
                          color: AppColors.white,
                        ),
                      ),
                    ),
                  ),
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
