import 'package:flutter/material.dart';

import 'package:capartner/features/auth/utils/password_validator.dart';
import 'package:capartner/features/auth/widgets/auth_widgets.dart';

/// Sends the current and the new password to the backend, which emails a code;
/// completes with the message to show when it is rejected, or null when the
/// code screen opens.
typedef ChangePasswordCallback = Future<String?> Function(
  String currentPassword,
  String newPassword,
);

/// Change Password, opened from Edit Profile.
///
/// Step 1 of 2: current password + new strong password. Step 2 is the
/// 6-digit code sent to the enforcer's email, shown by the caller.
class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key, this.onSubmit});

  final ChangePasswordCallback? onSubmit;

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final TextEditingController _currentController = TextEditingController();
  final TextEditingController _newController = TextEditingController();
  final TextEditingController _confirmController = TextEditingController();
  final FocusNode _currentFocusNode = FocusNode();
  final FocusNode _newFocusNode = FocusNode();
  final FocusNode _confirmFocusNode = FocusNode();

  // Errors stay hidden until the user tries to continue.
  bool _showErrors = false;

  /// True while waiting for the backend's answer.
  bool _busy = false;

  /// Message from the backend for the last try (example: current password is wrong).
  String? _serverError;

  String? get _currentError =>
      _currentController.text.isEmpty ? 'Please enter your current password.' : _serverError;
  String? get _newError {
    final problem = validatePassword(_newController.text);
    if (problem != null) return problem;
    if (_newController.text == _currentController.text) {
      return 'New password must be different from the current one.';
    }
    return null;
  }

  String? get _confirmError =>
      validatePasswordConfirmation(_newController.text, _confirmController.text);
  bool get _isValid =>
      _currentController.text.isNotEmpty && _newError == null && _confirmError == null;

  @override
  void initState() {
    super.initState();
    _currentController.addListener(() => setState(() => _serverError = null));
    _newController.addListener(() => setState(() {}));
    _confirmController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    _currentFocusNode.dispose();
    _newFocusNode.dispose();
    _confirmFocusNode.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    if (!_isValid) {
      setState(() => _showErrors = true);
      (_currentController.text.isEmpty
              ? _currentFocusNode
              : _newError != null
              ? _newFocusNode
              : _confirmFocusNode)
          .requestFocus();
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() => _busy = true);
    final error = await widget.onSubmit?.call(
      _currentController.text,
      _newController.text,
    );
    if (!mounted) return;
    setState(() {
      _busy = false;
      if (error != null) {
        _serverError = error;
        _showErrors = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final currentError = _showErrors ? _currentError : null;
    final newError = _showErrors ? _newError : null;
    final confirmError = _showErrors ? _confirmError : null;

    return AuthScaffold(
      title: 'Change Password',
      titleTop: 40,
      titleLeftInset: 43,
      iconAsset: 'assets/images/secure.png',
      iconSize: 120,
      heading: 'Change Your Password',
      subheading: 'We will email you a 6-digit code to confirm.',
      children: [
        const SizedBox(height: 32),
        AuthPasswordField(
          controller: _currentController,
          focusNode: _currentFocusNode,
          hintText: 'Current Password',
          hasError: currentError != null,
          autofillHints: const [AutofillHints.password],
          textInputAction: TextInputAction.next,
          onEditingComplete: _newFocusNode.requestFocus,
        ),
        AuthErrorText(message: currentError, minHeight: 20),
        AuthPasswordField(
          controller: _newController,
          focusNode: _newFocusNode,
          hintText: 'New Password',
          hasError: newError != null,
          autofillHints: const [AutofillHints.newPassword],
          textInputAction: TextInputAction.next,
          onEditingComplete: _confirmFocusNode.requestFocus,
        ),
        AuthErrorText(message: newError, minHeight: 20),
        AuthPasswordField(
          controller: _confirmController,
          focusNode: _confirmFocusNode,
          hintText: 'Confirm New Password',
          hasError: confirmError != null,
          autofillHints: const [AutofillHints.newPassword],
          textInputAction: TextInputAction.done,
          onEditingComplete: _submit,
        ),
        AuthErrorText(message: confirmError, minHeight: 20),
        AuthButton(
          label: _busy ? 'Please wait...' : 'Send Code',
          active: _isValid && !_busy,
          onPressed: _submit,
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
