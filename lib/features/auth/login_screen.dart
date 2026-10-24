import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Checks the entered credentials with the backend; completes with the message
/// to show when they are rejected, or null when the login moves on.
typedef LoginCallback = Future<String?> Function(
  String identifier,
  String password,
  bool rememberMe,
);

/// Login screen (Figma node 528:141).
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.onLogin, this.onForgotPassword});

  final LoginCallback? onLogin;
  final VoidCallback? onForgotPassword;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _identifierController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final FocusNode _identifierFocusNode = FocusNode();
  final FocusNode _passwordFocusNode = FocusNode();

  bool _rememberMe = true;
  bool _showErrors = false;

  /// True while waiting for the backend's answer.
  bool _busy = false;

  /// Message returned by [LoginScreen.onLogin] for the last attempt.
  String? _loginError;

  String get _identifier => _identifierController.text.trim();
  String get _password => _passwordController.text;
  bool get _isFilled => _identifier.isNotEmpty && _password.isNotEmpty;

  String? get _identifierError =>
      _identifier.isEmpty ? 'Please enter your email.' : null;
  String? get _passwordError =>
      _password.isEmpty ? 'Please enter your password.' : _loginError;

  @override
  void initState() {
    super.initState();
    _identifierController.addListener(_onInputChanged);
    _passwordController.addListener(_onInputChanged);
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _identifierFocusNode.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  void _onInputChanged() => setState(() => _loginError = null);

  Future<void> _submit() async {
    if (_busy) return;
    if (!_isFilled) {
      setState(() => _showErrors = true);
      (_identifier.isEmpty ? _identifierFocusNode : _passwordFocusNode)
          .requestFocus();
      return;
    }
    setState(() => _busy = true);
    final error = await widget.onLogin?.call(_identifier, _password, _rememberMe);
    if (!mounted) return;
    setState(() => _busy = false);
    if (error == null) {
      FocusScope.of(context).unfocus();
      return;
    }
    setState(() {
      _showErrors = true;
      _loginError = error;
    });
    _passwordFocusNode.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final identifierError = _showErrors ? _identifierError : null;
    final passwordError = _showErrors ? _passwordError : null;
    final hintStyle = authTextStyle(
      fontSize: 14,
      weight: FontWeight.w300,
      color: AppColors.greyGreen,
    );

    return LoginScaffold(
      title: 'Login',
      children: [
        const SizedBox(height: 15),
        Image.asset('assets/images/test_account.png', width: 90, height: 90),
        const SizedBox(height: 12),
        Text(
          'Welcome Back, CAPartner!',
          textAlign: TextAlign.center,
          maxLines: 1,
          style: authTextStyle(
            fontSize: 24,
            lineHeight: 30,
            weight: FontWeight.w700,
          ),
        ),
        Text(
          'Log in to continue to your CAPartner account.',
          textAlign: TextAlign.center,
          style: authTextStyle(
            fontSize: 14,
            lineHeight: 30,
            weight: FontWeight.w400,
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 19),
        _buildLabel('Email'),
        const SizedBox(height: 5),
        _buildIdentifierField(
          hasError: identifierError != null,
          hintStyle: hintStyle,
        ),
        AuthErrorText(message: identifierError, minHeight: 12),
        _buildLabel('Password'),
        const SizedBox(height: 3),
        AuthPasswordField(
          controller: _passwordController,
          focusNode: _passwordFocusNode,
          hintText: 'Enter your password',
          hintStyle: hintStyle,
          hasError: passwordError != null,
          autofillHints: const [AutofillHints.password],
          textInputAction: TextInputAction.done,
          onEditingComplete: _submit,
        ),
        AuthErrorText(message: passwordError, minHeight: 0),
        // The error takes its room from this row so the button stays put.
        SizedBox(
          height: passwordError == null ? 44 : 28,
          child: _buildOptionsRow(),
        ),
        AuthButton(
          label: _busy ? 'Please wait...' : 'Continue',
          active: _isFilled && !_busy,
          onPressed: _submit,
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text,
        style: authTextStyle(
          fontSize: 14,
          lineHeight: 20,
          weight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildIdentifierField({
    required bool hasError,
    required TextStyle hintStyle,
  }) {
    return AuthInputBox(
      height: 44,
      hasError: hasError,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18),
        child: Center(
          child: TextField(
            controller: _identifierController,
            focusNode: _identifierFocusNode,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autocorrect: false,
            enableSuggestions: false,
            autofillHints: const [AutofillHints.username, AutofillHints.email],
            inputFormatters: [
              FilteringTextInputFormatter.deny(RegExp(r'\s')),
              LengthLimitingTextInputFormatter(254),
            ],
            cursorColor: AppColors.darkGreen,
            onEditingComplete: _passwordFocusNode.requestFocus,
            style: authTextStyle(fontSize: 14, weight: FontWeight.w500),
            decoration: InputDecoration(
              isCollapsed: true,
              border: InputBorder.none,
              hintText: 'Enter your email',
              hintStyle: hintStyle,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOptionsRow() {
    return Row(
      children: [
        Semantics(
          checked: _rememberMe,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => setState(() => _rememberMe = !_rememberMe),
            child: Row(
              children: [
                const SizedBox(width: 5),
                if (_rememberMe)
                  Image.asset(
                    'assets/images/checked_checkbox.png',
                    width: 20,
                    height: 20,
                  )
                else
                  // The Figma file only has the checked-state icon.
                  Container(
                    width: 20,
                    height: 20,
                    padding: const EdgeInsets.all(2.5),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: AppColors.darkGreen,
                          width: 1.5,
                        ),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                const SizedBox(width: 5),
                Text(
                  'Remember me',
                  style: authTextStyle(fontSize: 12, weight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 8),
        // Shrinks the link instead of overflowing at large text sizes.
        Expanded(
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerRight,
            child: Semantics(
              button: true,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: widget.onForgotPassword,
                child: Text(
                  'Forgot Password?',
                  style: authTextStyle(fontSize: 11, weight: FontWeight.w600)
                      .copyWith(
                        decoration: TextDecoration.underline,
                        decorationColor: AppColors.darkGreen,
                      ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
