import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Password input with an eye icon that shows or hides what was typed.
class AuthPasswordField extends StatefulWidget {
  const AuthPasswordField({
    super.key,
    required this.controller,
    required this.focusNode,
    required this.hintText,
    required this.textInputAction,
    required this.onEditingComplete,
    required this.autofillHints,
    this.hasError = false,
    this.hintStyle,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final String hintText;
  final TextInputAction textInputAction;
  final VoidCallback onEditingComplete;
  final Iterable<String> autofillHints;
  final bool hasError;

  /// Defaults to the medium grey hint of the Create Password design.
  final TextStyle? hintStyle;

  static const int maxLength = 64;

  @override
  State<AuthPasswordField> createState() => _AuthPasswordFieldState();
}

class _AuthPasswordFieldState extends State<AuthPasswordField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return AuthInputBox(
      height: 44,
      hasError: widget.hasError,
      child: Padding(
        padding: const EdgeInsets.only(left: 18, right: 5),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: widget.controller,
                focusNode: widget.focusNode,
                obscureText: _obscure,
                keyboardType: TextInputType.visiblePassword,
                textInputAction: widget.textInputAction,
                autocorrect: false,
                enableSuggestions: false,
                autofillHints: widget.autofillHints,
                inputFormatters: [
                  LengthLimitingTextInputFormatter(AuthPasswordField.maxLength),
                ],
                cursorColor: AppColors.darkGreen,
                onEditingComplete: widget.onEditingComplete,
                style: authTextStyle(fontSize: 14, weight: FontWeight.w500),
                decoration: InputDecoration(
                  isCollapsed: true,
                  border: InputBorder.none,
                  hintText: widget.hintText,
                  hintStyle:
                      widget.hintStyle ??
                      authTextStyle(
                        fontSize: 14,
                        weight: FontWeight.w500,
                        color: AppColors.grey,
                      ),
                ),
              ),
            ),
            Semantics(
              button: true,
              label: _obscure ? 'Show password' : 'Hide password',
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => setState(() => _obscure = !_obscure),
                child: SizedBox(
                  width: 41,
                  height: double.infinity,
                  child: Center(
                    child: _obscure
                        ? Image.asset(
                            'assets/images/invisible.png',
                            width: 18,
                            height: 18,
                          )
                        // The Figma file only has the hidden-state icon.
                        : const Icon(
                            Icons.visibility,
                            size: 18,
                            color: AppColors.darkGreen,
                          ),
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

/// White bordered box used for text inputs.
class AuthInputBox extends StatelessWidget {
  const AuthInputBox({
    super.key,
    required this.height,
    required this.child,
    this.width,
    this.hasError = false,
  });

  final double height;
  final double? width;
  final bool hasError;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border.all(
          color: hasError ? AppColors.error : AppColors.darkGreen,
          width: 2,
        ),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Stack(
        children: [
          // Stands in for the design's inset shadow along the top edge.
          const Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Color(0x33000000), Color(0x00000000)],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}

/// Validation message shown under an input.
///
/// Always takes up at least [minHeight] so a one-line message fills the gap
/// that is already in the design instead of pushing the content down.
class AuthErrorText extends StatelessWidget {
  const AuthErrorText({
    super.key,
    required this.message,
    required this.minHeight,
    this.alignment = Alignment.centerLeft,
  });

  final String? message;
  final double minHeight;
  final Alignment alignment;

  @override
  Widget build(BuildContext context) {
    final message = this.message;
    return ConstrainedBox(
      constraints: BoxConstraints(minHeight: minHeight),
      child: Align(
        alignment: alignment,
        child: message == null
            ? null
            : Semantics(
                liveRegion: true,
                child: Text(
                  message,
                  textAlign: alignment == Alignment.center
                      ? TextAlign.center
                      : TextAlign.start,
                  style: authTextStyle(
                    color: AppColors.error,
                    fontSize: 12,
                    lineHeight: 16,
                    weight: FontWeight.w500,
                  ).copyWith(letterSpacing: 0),
                ),
              ),
      ),
    );
  }
}

/// Full-width primary button.
///
/// While not [active] it is dimmed like the design's disabled state but still
/// tappable, so a tap can reveal why the form cannot be submitted yet.
class AuthButton extends StatelessWidget {
  const AuthButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.active = true,
    this.color = AppColors.darkGreen,
  });

  final String label;
  final VoidCallback onPressed;
  final bool active;

  /// Fill colour; red for destructive actions such as logging out.
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 44,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: active ? color : color.withValues(alpha: 0.5),
          foregroundColor: AppColors.white,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          textStyle: authTextStyle(fontSize: 16, weight: FontWeight.w700),
        ),
        child: Text(label),
      ),
    );
  }
}
