import 'package:flutter/material.dart';

import 'package:capartner/features/auth/utils/password_validator.dart';
import 'package:capartner/features/auth/widgets/auth_widgets.dart';

/// Saves the new password with the backend; completes with the message to show
/// when it is rejected, or null when the flow moves on.
typedef PasswordSubmitCallback = Future<String?> Function(String password);

/// Create password screen (Figma node 528:106).
///
/// [onSubmit] is called with the new password once it is strong enough and
/// both fields match.
class PasswordScreen extends StatefulWidget {
  const PasswordScreen({super.key, this.onSubmit})
    : title = 'Password',
      titleLeftInset = 7,
      buttonLabel = 'Create Password';

  /// Last step of Forgot Password (Figma node 635:1955).
  const PasswordScreen.forgotPassword({super.key, this.onSubmit})
    : title = 'Forgot Password',
      titleLeftInset = 43,
      buttonLabel = 'Update Password';

  final PasswordSubmitCallback? onSubmit;

  final String title;
  final double titleLeftInset;
  final String buttonLabel;

  @override
  State<PasswordScreen> createState() => _PasswordScreenState();
}

class _PasswordScreenState extends State<PasswordScreen> {
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmController = TextEditingController();
  final FocusNode _passwordFocusNode = FocusNode();
  final FocusNode _confirmFocusNode = FocusNode();

  // Errors stay hidden until the user has left the field or tried to move on,
  // so the message does not flash while they are still typing.
  bool _showPasswordError = false;
  bool _showConfirmError = false;

  /// True while waiting for the backend's answer.
  bool _busy = false;

  /// Message from the backend for the last try (example: same as the old password).
  String? _serverError;

  String? get _passwordError =>
      validatePassword(_passwordController.text) ?? _serverError;
  String? get _confirmError => validatePasswordConfirmation(
    _passwordController.text,
    _confirmController.text,
  );
  bool get _isValid => _passwordError == null && _confirmError == null;

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(() => setState(() => _serverError = null));
    _confirmController.addListener(() => setState(() {}));
    _passwordFocusNode.addListener(_onPasswordFocusChanged);
    _confirmFocusNode.addListener(_onConfirmFocusChanged);
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    _passwordFocusNode.dispose();
    _confirmFocusNode.dispose();
    super.dispose();
  }

  void _onPasswordFocusChanged() {
    if (!_passwordFocusNode.hasFocus &&
        _passwordController.text.isNotEmpty &&
        !_showPasswordError) {
      setState(() => _showPasswordError = true);
    }
  }

  void _onConfirmFocusChanged() {
    if (!_confirmFocusNode.hasFocus &&
        _confirmController.text.isNotEmpty &&
        !_showConfirmError) {
      setState(() => _showConfirmError = true);
    }
  }

  Future<void> _submit() async {
    if (_busy) return;
    if (!_isValid) {
      setState(() {
        _showPasswordError = true;
        _showConfirmError = true;
      });
      (_passwordError != null ? _passwordFocusNode : _confirmFocusNode)
          .requestFocus();
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() => _busy = true);
    final error = await widget.onSubmit?.call(_passwordController.text);
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (error != null) {
        _serverError = error;
        _showPasswordError = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final passwordError = _showPasswordError ? _passwordError : null;
    final confirmError = _showConfirmError ? _confirmError : null;

    return AuthScaffold(
      title: widget.title,
      titleTop: 40,
      titleLeftInset: widget.titleLeftInset,
      iconAsset: 'assets/images/secure.png',
      iconSize: 150,
      heading: 'Create Your Password',
      subheading: 'Create a password to secure your account.',
      children: [
        const SizedBox(height: 43),
        AuthPasswordField(
          controller: _passwordController,
          focusNode: _passwordFocusNode,
          hintText: 'Enter New Password',
          hasError: passwordError != null,
          autofillHints: const [AutofillHints.newPassword],
          textInputAction: TextInputAction.next,
          onEditingComplete: _confirmFocusNode.requestFocus,
        ),
        AuthErrorText(message: passwordError, minHeight: 20),
        AuthPasswordField(
          controller: _confirmController,
          focusNode: _confirmFocusNode,
          hintText: 'Confirm New Password',
          hasError: confirmError != null,
          autofillHints: const [AutofillHints.newPassword],
          textInputAction: TextInputAction.done,
          // Keeps the keyboard open when the password is rejected.
          onEditingComplete: _submit,
        ),
        AuthErrorText(message: confirmError, minHeight: 20),
        AuthButton(
          label: _busy ? 'Please wait...' : widget.buttonLabel,
          active: _isValid && !_busy,
          onPressed: _submit,
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
