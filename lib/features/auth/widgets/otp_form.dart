import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Six code boxes, the Verify button and the resend link, as used on the OTP
/// screens.
///
/// [onVerify] is called with the code once all six digits are entered, and
/// [onResend] when the user asks for a new code. Checking the code is left to
/// the caller.
class OtpForm extends StatefulWidget {
  const OtpForm({super.key, this.onVerify, this.onResend});

  final ValueChanged<String>? onVerify;
  final VoidCallback? onResend;

  static const int codeLength = 6;
  static const int resendCooldownSeconds = 30;

  @override
  State<OtpForm> createState() => _OtpFormState();
}

class _OtpFormState extends State<OtpForm> {
  // Sizes below are taken from the 390x844 Figma frames.
  static const double _boxWidth = 39;
  static const double _boxHeight = 51;
  static const double _boxGap = 10;
  static const double _boxesWidth =
      _boxWidth * OtpForm.codeLength + _boxGap * (OtpForm.codeLength - 1);

  final TextEditingController _codeController = TextEditingController();
  final FocusNode _codeFocusNode = FocusNode();

  Timer? _resendTimer;
  int _resendSecondsLeft = 0;
  bool _showError = false;

  String get _code => _codeController.text;
  bool get _isComplete => _code.length == OtpForm.codeLength;

  String? get _error {
    if (_isComplete) return null;
    return _code.isEmpty
        ? 'Please enter the 6-digit code.'
        : 'The code must be 6 digits.';
  }

  @override
  void initState() {
    super.initState();
    _codeController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    _codeController.dispose();
    _codeFocusNode.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_isComplete) {
      setState(() => _showError = true);
      _codeFocusNode.requestFocus();
      return;
    }
    _codeFocusNode.unfocus();
    widget.onVerify?.call(_code);
  }

  void _resend() {
    _codeController.clear();
    setState(() {
      _showError = false;
      _resendSecondsLeft = OtpForm.resendCooldownSeconds;
    });
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _resendSecondsLeft--);
      if (_resendSecondsLeft <= 0) timer.cancel();
    });
    _codeFocusNode.requestFocus();
    widget.onResend?.call();
  }

  @override
  Widget build(BuildContext context) {
    final visibleError = _showError ? _error : null;

    return Column(
      children: [
        _buildCodeBoxes(hasError: visibleError != null),
        AuthErrorText(
          message: visibleError,
          minHeight: 42,
          alignment: Alignment.center,
        ),
        AuthButton(label: 'Verify', active: _isComplete, onPressed: _submit),
        const SizedBox(height: 3),
        _buildResend(),
      ],
    );
  }

  Widget _buildCodeBoxes({required bool hasError}) {
    return FittedBox(
      fit: BoxFit.scaleDown,
      child: SizedBox(
        width: _boxesWidth,
        height: _boxHeight,
        child: Stack(
          children: [
            ExcludeSemantics(
              child: Row(
                spacing: _boxGap,
                children: [
                  for (var i = 0; i < OtpForm.codeLength; i++)
                    AuthInputBox(
                      width: _boxWidth,
                      height: _boxHeight,
                      hasError: hasError,
                      child: Center(
                        child: Text(
                          i < _code.length ? _code[i] : '0',
                          style: authTextStyle(
                            fontSize: 16,
                            weight: FontWeight.w700,
                            color: i < _code.length
                                ? AppColors.darkGreen
                                : AppColors.darkGreen.withValues(alpha: 0.25),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // One invisible field on top of the boxes takes all the input, so
            // typing, deleting, pasting and code autofill work across boxes.
            Positioned.fill(
              child: Opacity(
                opacity: 0,
                child: TextField(
                  controller: _codeController,
                  focusNode: _codeFocusNode,
                  autofocus: true,
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.oneTimeCode],
                  enableInteractiveSelection: false,
                  showCursor: false,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(OtpForm.codeLength),
                  ],
                  onEditingComplete: _submit,
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    labelText: '6-digit code',
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResend() {
    final canResend = _resendSecondsLeft <= 0;
    final linkStyle = authTextStyle(
      fontSize: 14,
      lineHeight: 43.5,
      weight: FontWeight.w600,
    );

    return Wrap(
      alignment: WrapAlignment.center,
      children: [
        Text(
          "Didn't receive the code? ",
          style: authTextStyle(
            fontSize: 14,
            lineHeight: 43.5,
            weight: FontWeight.w400,
            fontStyle: FontStyle.italic,
          ),
        ),
        if (canResend)
          Semantics(
            button: true,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: _resend,
              child: Text(
                'Resend OTP',
                style: linkStyle.copyWith(
                  decoration: TextDecoration.underline,
                  decorationColor: AppColors.darkGreen,
                ),
              ),
            ),
          )
        else
          Text(
            'Resend OTP in ${_resendSecondsLeft}s',
            style: linkStyle.copyWith(
              color: AppColors.darkGreen.withValues(alpha: 0.5),
            ),
          ),
      ],
    );
  }
}
