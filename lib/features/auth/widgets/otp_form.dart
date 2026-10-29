import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/auth/widgets/verification_layout.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Six code boxes, the Verify button and the resend link, as used on the OTP
/// screens.
///
/// Once the sixth digit is in, the code is sent on by itself after a short
/// pause; tapping Verify sends it at once. [onVerify] checks the code and
/// [onResend] asks for a new one. Both return the message to show when they
/// fail, or null, and the "Verifying" spinner shows while [onVerify] runs.
class OtpForm extends StatefulWidget {
  const OtpForm({super.key, this.onVerify, this.onResend});

  final Future<String?> Function(String code)? onVerify;
  final Future<String?> Function()? onResend;

  static const int codeLength = 6;
  static const int resendCooldownSeconds = 30;

  @override
  State<OtpForm> createState() => _OtpFormState();
}

class _OtpFormState extends State<OtpForm> {
  static const double _boxWidth = 46;
  static const double _boxHeight = 56;
  static const double _boxGap = 8;
  static const double _boxesWidth =
      _boxWidth * OtpForm.codeLength + _boxGap * (OtpForm.codeLength - 1);

  /// Pause after the sixth digit before the code is sent on.
  static const Duration _verifyDelay = Duration(milliseconds: 700);

  final TextEditingController _codeController = TextEditingController();
  final FocusNode _codeFocusNode = FocusNode();

  Timer? _resendTimer;
  Timer? _verifyTimer;
  int _resendSecondsLeft = 0;
  bool _showError = false;
  String _lastCode = '';

  /// Whether [OtpForm.onVerify] is still running.
  bool _checking = false;

  /// Why the server turned down the last code or resend.
  String? _serverError;

  /// Shown once a new code is on its way.
  String? _notice;

  String get _code => _codeController.text;
  bool get _isComplete => _code.length == OtpForm.codeLength;
  bool get _verifying => (_verifyTimer?.isActive ?? false) || _checking;

  String? get _error {
    if (_serverError != null) return _serverError;
    if (_isComplete) return null;
    return _code.isEmpty
        ? 'Please enter the 6-digit code.'
        : 'The code must be 6 digits.';
  }

  @override
  void initState() {
    super.initState();
    _codeController.addListener(_onCodeChanged);
    _codeFocusNode.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    _verifyTimer?.cancel();
    _codeController.dispose();
    _codeFocusNode.dispose();
    super.dispose();
  }

  void _onCodeChanged() {
    // The listener also fires for cursor moves.
    if (_code == _lastCode) return;
    _lastCode = _code;
    _verifyTimer?.cancel();
    _serverError = null;
    _notice = null;
    if (_isComplete && !_checking) {
      _verifyTimer = Timer(_verifyDelay, _submit);
    }
    setState(() {});
  }

  Future<void> _submit() async {
    _verifyTimer?.cancel();
    if (_checking) return;
    if (!_isComplete) {
      setState(() => _showError = true);
      _codeFocusNode.requestFocus();
      return;
    }
    setState(() {
      _checking = true;
      _notice = null;
    });
    _codeFocusNode.unfocus();
    final error = await widget.onVerify?.call(_code);
    if (!mounted) return;
    setState(() {
      _checking = false;
      _serverError = error;
      _showError = error != null;
    });
    if (error != null) _codeFocusNode.requestFocus();
  }

  Future<void> _resend() async {
    _codeController.clear();
    setState(() {
      _showError = false;
      _serverError = null;
      _notice = null;
      _resendSecondsLeft = OtpForm.resendCooldownSeconds;
    });
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() => _resendSecondsLeft--);
      if (_resendSecondsLeft <= 0) timer.cancel();
    });
    _codeFocusNode.requestFocus();
    final error = await widget.onResend?.call();
    if (!mounted) return;
    setState(() {
      if (error == null) {
        _notice = 'A new code was sent to your email.';
      } else {
        // Nothing was sent, so there is nothing to wait for.
        _resendTimer?.cancel();
        _resendSecondsLeft = 0;
        _serverError = error;
        _showError = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final visibleError = _showError ? _error : null;

    return Column(
      children: [
        _buildCodeBoxes(hasError: visibleError != null),
        _buildStatusLine(visibleError),
        const SizedBox(height: 12),
        VerificationButton(
          label: 'Verify',
          active: _isComplete && !_checking,
          onPressed: _submit,
        ),
        const SizedBox(height: 12),
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
                    _buildBox(i, hasError: hasError),
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

  /// Box [i]: filled boxes and the one being typed into are outlined green.
  Widget _buildBox(int i, {required bool hasError}) {
    final filled = i < _code.length;
    final active = _codeFocusNode.hasFocus && i == _code.length;
    final borderColor = hasError
        ? AppColors.error
        : filled || active
        ? AppColors.green
        : AppColors.outline;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      width: _boxWidth,
      height: _boxHeight,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: filled || active ? AppColors.white : AppColors.paleMint,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: active ? 2 : 1.5),
      ),
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 150),
        transitionBuilder: (child, animation) => ScaleTransition(
          scale: CurvedAnimation(parent: animation, curve: Curves.easeOutBack),
          child: child,
        ),
        child: filled
            ? Text(
                _code[i],
                key: ValueKey('digit$i${_code[i]}'),
                style: appTextStyle(
                  fontSize: 22,
                  weight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              )
            : active
            // Stands in for the cursor of the hidden field.
            ? Container(
                key: const ValueKey('caret'),
                width: 2,
                height: 22,
                color: AppColors.green,
              )
            : const SizedBox.shrink(key: ValueKey('empty')),
      ),
    );
  }

  /// Why the code cannot be sent yet or was turned down, the spinner while
  /// it is checked, or that a new code was sent.
  Widget _buildStatusLine(String? error) {
    final Widget? content;
    if (_verifying) {
      content = Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox.square(
            dimension: 14,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.green,
              semanticsLabel: 'Verifying code',
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'Verifying code...',
            style: appTextStyle(
              fontSize: 12,
              lineHeight: 16,
              weight: FontWeight.w500,
              color: AppColors.mutedText,
            ),
          ),
        ],
      );
    } else if (error != null || _notice != null) {
      content = Semantics(
        liveRegion: true,
        child: Text(
          error ?? _notice!,
          textAlign: TextAlign.center,
          style: appTextStyle(
            fontSize: 12,
            lineHeight: 16,
            weight: FontWeight.w500,
            color: error != null ? AppColors.error : AppColors.green,
          ),
        ),
      );
    } else {
      content = null;
    }

    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 28),
      child: Padding(
        padding: const EdgeInsets.only(top: 10),
        child: Center(child: content),
      ),
    );
  }

  Widget _buildResend() {
    final canResend = _resendSecondsLeft <= 0;
    final textStyle = appTextStyle(
      fontSize: 14,
      weight: FontWeight.w500,
      color: AppColors.bodyText,
    );

    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Text("Didn't receive the code? ", style: textStyle),
        if (canResend)
          Semantics(
            button: true,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: _resend,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(
                  'Resend OTP',
                  style: textStyle.copyWith(
                    color: AppColors.green,
                    fontWeight: FontWeight.w700,
                    fontVariations: const [FontVariation.weight(700)],
                  ),
                ),
              ),
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.schedule_rounded,
                  size: 16,
                  color: AppColors.mutedText,
                ),
                const SizedBox(width: 4),
                Text(
                  'Resend OTP in ${_resendSecondsLeft}s',
                  style: textStyle.copyWith(color: AppColors.mutedText),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
