import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/auth/utils/email_validator.dart';
import 'package:capartner/features/auth/widgets/verification_layout.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Email screen, the first step of Forgot Password.
///
/// The email's format is checked live, shortly after the user stops typing:
/// a check mark, or the reason it was rejected. [onContinue] is called with
/// a well-formed email and returns the message to show when it fails; the
/// Continue button spins while it runs.
class EmailScreen extends StatefulWidget {
  const EmailScreen({super.key, this.onContinue});

  final Future<String?> Function(String email)? onContinue;

  @override
  State<EmailScreen> createState() => _EmailScreenState();
}

/// Where the live check of the typed email is at.
enum _EmailStatus { empty, typing, valid, invalid }

class _EmailScreenState extends State<EmailScreen> {
  /// Quiet time after the last keystroke before the email is checked.
  static const Duration _typingPause = Duration(milliseconds: 500);

  final TextEditingController _emailController = TextEditingController();
  final FocusNode _emailFocusNode = FocusNode();

  _EmailStatus _status = _EmailStatus.empty;

  /// Why the email is [_EmailStatus.invalid].
  String? _message;

  /// Once the user has tried to continue, every keystroke is checked at once
  /// instead of waiting for them to pause.
  bool _attempted = false;

  /// Whether [EmailScreen.onContinue] is still running.
  bool _sending = false;

  String _lastText = '';
  Timer? _typingTimer;

  String get _email => _emailController.text.trim();

  @override
  void initState() {
    super.initState();
    _emailController.addListener(_onEmailChanged);
    _emailFocusNode.addListener(_onFocusChanged);
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _emailController.dispose();
    _emailFocusNode.dispose();
    super.dispose();
  }

  void _onEmailChanged() {
    // The listener also fires for cursor moves.
    if (_emailController.text == _lastText) return;
    _lastText = _emailController.text;
    _typingTimer?.cancel();

    if (_email.isEmpty) {
      setState(() {
        _status = _attempted ? _EmailStatus.invalid : _EmailStatus.empty;
        _message = _attempted ? validateEmail('') : null;
      });
    } else if (_attempted) {
      _check();
    } else {
      setState(() => _status = _EmailStatus.typing);
      _typingTimer = Timer(_typingPause, _check);
    }
  }

  void _onFocusChanged() {
    // Check right away when the user leaves the field mid-typing.
    if (!_emailFocusNode.hasFocus && _status == _EmailStatus.typing) {
      _typingTimer?.cancel();
      _check();
    }
    setState(() {});
  }

  void _check() {
    final error = validateEmail(_email);
    setState(() {
      _status = error == null ? _EmailStatus.valid : _EmailStatus.invalid;
      _message = error;
    });
  }

  Future<void> _submit() async {
    if (_sending) return;
    _typingTimer?.cancel();
    _attempted = true;
    final email = _email;
    final error = validateEmail(email);
    if (error != null) {
      setState(() {
        _status = _EmailStatus.invalid;
        _message = error;
      });
      _emailFocusNode.requestFocus();
      return;
    }
    setState(() {
      _status = _EmailStatus.valid;
      _sending = true;
    });
    _emailFocusNode.unfocus();
    final rejection = await widget.onContinue?.call(email);
    if (!mounted) return;
    setState(() {
      _sending = false;
      if (rejection != null) {
        _status = _EmailStatus.invalid;
        _message = rejection;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return VerificationScaffold(
      title: 'Forgot Password',
      iconAsset: 'assets/images/letter.png',
      heading: 'Email Verification',
      subheading: 'Enter your email to verify your account to change password.',
      step: 0,
      children: [
        const VerificationLabel('Email address'),
        const SizedBox(height: 8),
        _buildEmailField(),
        _buildStatusLine(),
        const SizedBox(height: 24),
        VerificationButton(
          label: 'Continue',
          active: _status == _EmailStatus.valid && !_sending,
          busy: _sending,
          onPressed: _submit,
        ),
        const SizedBox(height: 28),
        const VerificationNote(
          icon: Icons.lock_outline_rounded,
          text: "We'll send a 6-digit code to this email.",
        ),
      ],
    );
  }

  Widget _buildEmailField() {
    final focused = _emailFocusNode.hasFocus;
    final borderColor = switch (_status) {
      _EmailStatus.invalid => AppColors.error,
      _EmailStatus.valid => AppColors.green,
      _ when focused => AppColors.green,
      _ => AppColors.outline,
    };

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: focused ? AppColors.white : AppColors.paleMint,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: focused ? 2 : 1.5),
      ),
      child: Row(
        children: [
          Icon(
            Icons.mail_outline_rounded,
            size: 22,
            color: focused ? AppColors.green : AppColors.mutedText,
          ),
          const SizedBox(width: 12),
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
              cursorColor: AppColors.green,
              // Keeps the keyboard open when the email is rejected.
              onEditingComplete: _submit,
              style: appTextStyle(
                fontSize: 15,
                weight: FontWeight.w500,
                color: AppColors.ink,
              ),
              decoration: InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                hintText: 'you@gmail.com',
                hintStyle: appTextStyle(
                  fontSize: 15,
                  weight: FontWeight.w500,
                  color: AppColors.grey,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          SizedBox(
            width: 24,
            height: 24,
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              transitionBuilder: (child, animation) => ScaleTransition(
                scale: CurvedAnimation(
                  parent: animation,
                  curve: Curves.easeOutBack,
                ),
                child: FadeTransition(
                  opacity: animation,
                  alwaysIncludeSemantics: true,
                  child: child,
                ),
              ),
              child: _buildStatusIcon(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusIcon() {
    return switch (_status) {
      _EmailStatus.valid => const Icon(
        Icons.check_circle_rounded,
        key: ValueKey('valid'),
        size: 24,
        color: AppColors.green,
        semanticLabel: 'Valid email',
      ),
      _EmailStatus.invalid => const Icon(
        Icons.error_outline_rounded,
        key: ValueKey('invalid'),
        size: 24,
        color: AppColors.error,
      ),
      _ => const SizedBox.shrink(key: ValueKey('none')),
    };
  }

  /// Message under the field: why the email is rejected, or that a code is
  /// being sent.
  Widget _buildStatusLine() {
    final (text, color) = switch (_status) {
      _EmailStatus.invalid => (_message, AppColors.error),
      _EmailStatus.valid when _sending => (
        'Sending your code...',
        AppColors.mutedText,
      ),
      _ => (null, AppColors.mutedText),
    };

    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 28),
      child: Padding(
        padding: const EdgeInsets.only(top: 8, left: 4),
        child: text == null
            ? null
            : Semantics(
                liveRegion: true,
                child: Text(
                  text,
                  style: appTextStyle(
                    fontSize: 12,
                    lineHeight: 16,
                    weight: FontWeight.w500,
                    color: color,
                  ),
                ),
              ),
      ),
    );
  }
}
