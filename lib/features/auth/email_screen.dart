import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/auth/utils/email_validator.dart';
import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Email verification screen (Figma nodes 499:13 and 734:6).
///
/// [onContinue] is called with the entered email once it is valid.
class EmailScreen extends StatefulWidget {
  const EmailScreen({super.key, this.onContinue, this.checkEmail})
    : title = 'Email',
      titleTop = 46,
      titleLeftInset = 0,
      subheading = 'Enter your email to verify your account.',
      subheadingWidth = null;

  /// First step of Forgot Password (Figma nodes 635:1916 and 734:24).
  const EmailScreen.forgotPassword({
    super.key,
    this.onContinue,
    this.checkEmail,
  }) : title = 'Forgot Password',
       titleTop = 40,
       titleLeftInset = 43,
       subheading =
           'Enter your email to verify your account to change password',
       subheadingWidth = 219;

  final ValueChanged<String>? onContinue;

  /// Extra check run on a well-formed email when the user continues; returns
  /// the message to show when the email is rejected, or null to accept it.
  final String? Function(String email)? checkEmail;

  final String title;
  final double titleTop;
  final double titleLeftInset;
  final String subheading;
  final double? subheadingWidth;

  @override
  State<EmailScreen> createState() => _EmailScreenState();
}

class _EmailScreenState extends State<EmailScreen> {
  static const double _fieldHeight = 44;

  final TextEditingController _emailController = TextEditingController();
  final FocusNode _emailFocusNode = FocusNode();

  String? _error = validateEmail('');

  /// Message returned by [EmailScreen.checkEmail] for the last attempt.
  String? _rejection;

  // Errors stay hidden until the user has tried to move on, so the message
  // does not flash while they are still typing their first attempt.
  bool _showError = false;

  bool get _isValid => _error == null;

  @override
  void initState() {
    super.initState();
    _emailController.addListener(_onEmailChanged);
    _emailFocusNode.addListener(_onFocusChanged);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _emailFocusNode.dispose();
    super.dispose();
  }

  void _onEmailChanged() {
    final error = validateEmail(_emailController.text);
    if (error != _error || _rejection != null) {
      setState(() {
        _error = error;
        _rejection = null;
      });
    }
  }

  void _onFocusChanged() {
    if (!_emailFocusNode.hasFocus &&
        _emailController.text.isNotEmpty &&
        !_showError) {
      setState(() => _showError = true);
    }
  }

  void _submit() {
    if (!_isValid) {
      setState(() => _showError = true);
      _emailFocusNode.requestFocus();
      return;
    }
    final email = _emailController.text.trim();
    final rejection = widget.checkEmail?.call(email);
    if (rejection != null) {
      setState(() {
        _showError = true;
        _rejection = rejection;
      });
      _emailFocusNode.requestFocus();
      return;
    }
    _emailFocusNode.unfocus();
    widget.onContinue?.call(email);
  }

  @override
  Widget build(BuildContext context) {
    final visibleError = _showError ? _error ?? _rejection : null;

    return AuthScaffold(
      title: widget.title,
      titleTop: widget.titleTop,
      titleLeftInset: widget.titleLeftInset,
      iconAsset: 'assets/images/letter.png',
      iconSize: 69,
      heading: 'Email Verification',
      subheading: widget.subheading,
      subheadingWidth: widget.subheadingWidth,
      children: [
        const SizedBox(height: 68),
        _buildEmailField(hasError: visibleError != null),
        AuthErrorText(message: visibleError, minHeight: 18),
        AuthButton(label: 'Continue', active: _isValid, onPressed: _submit),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildEmailField({required bool hasError}) {
    return AuthInputBox(
      height: _fieldHeight,
      hasError: hasError,
      child: Padding(
        padding: const EdgeInsets.only(left: 6, right: 10),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _emailController,
                focusNode: _emailFocusNode,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.done,
                autocorrect: false,
                enableSuggestions: false,
                autofillHints: const [AutofillHints.email],
                inputFormatters: [
                  FilteringTextInputFormatter.deny(RegExp(r'\s')),
                  LengthLimitingTextInputFormatter(254),
                ],
                cursorColor: AppColors.darkGreen,
                // Keeps the keyboard open when the email is rejected.
                onEditingComplete: _submit,
                style: authTextStyle(fontSize: 14, weight: FontWeight.w500),
                decoration: InputDecoration(
                  isCollapsed: true,
                  border: InputBorder.none,
                  hintText: 'Enter your email',
                  hintStyle: authTextStyle(
                    fontSize: 14,
                    weight: FontWeight.w500,
                    color: AppColors.grey,
                  ),
                ),
              ),
            ),
            if (_isValid && _rejection == null)
              Padding(
                padding: const EdgeInsets.only(left: 8),
                child: Image.asset(
                  'assets/images/approval.png',
                  width: 20,
                  height: 20,
                  semanticLabel: 'Valid email',
                ),
              ),
          ],
        ),
      ),
    );
  }
}
