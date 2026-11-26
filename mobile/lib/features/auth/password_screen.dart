import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/auth/utils/password_validator.dart';
import 'package:capartner/features/auth/widgets/verification_layout.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// New password screen, the last step of Forgot Password.
///
/// The password's requirements tick off live as the user types, and the
/// confirmation shows when it matches. [onSubmit] is called with the new
/// password once it is strong enough and both fields match, and returns the
/// message to show when the server turns it down.
class PasswordScreen extends StatefulWidget {
  const PasswordScreen.forgotPassword({super.key, this.onSubmit})
    : title = 'Forgot Password',
      heading = 'Reset Your Password',
      subheading = 'Choose a new password for your account.',
      buttonLabel = 'Update Password',
      step = 2;

  /// Asked for after the first login's code, to replace the temporary
  /// password from the admin.
  const PasswordScreen.firstLogin({super.key, this.onSubmit})
    : title = 'Verify Login',
      heading = 'Create Your Password',
      subheading = 'Replace the temporary password your admin gave you.',
      buttonLabel = 'Create Password',
      step = null;

  final Future<String?> Function(String password)? onSubmit;

  final String title;
  final String heading;
  final String subheading;
  final String buttonLabel;

  /// Index in the step bar; null for no step bar.
  final int? step;

  @override
  State<PasswordScreen> createState() => _PasswordScreenState();
}

/// One rule of [validatePassword], shown as a chip under the field.
typedef _Requirement = ({String label, String name, bool Function(String) met});

class _PasswordScreenState extends State<PasswordScreen> {
  static final List<_Requirement> _requirements = [
    (
      label: '$minPasswordLength+ chars',
      name: 'At least $minPasswordLength characters',
      met: (p) => p.length >= minPasswordLength,
    ),
    (
      label: 'A-Z',
      name: 'Uppercase letter',
      met: (p) => p.contains(RegExp(r'[A-Z]')),
    ),
    (
      label: 'a-z',
      name: 'Lowercase letter',
      met: (p) => p.contains(RegExp(r'[a-z]')),
    ),
    (label: '0-9', name: 'Number', met: (p) => p.contains(RegExp(r'[0-9]'))),
    (
      label: '!@#',
      name: 'Special character',
      met: (p) => p.contains(RegExp(r'[^A-Za-z0-9\s]')),
    ),
  ];

  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmController = TextEditingController();
  final FocusNode _passwordFocusNode = FocusNode();
  final FocusNode _confirmFocusNode = FocusNode();

  // Problems stay hidden until the user has left the field or tried to move
  // on, so nothing turns red while they are still typing.
  bool _showPasswordError = false;
  bool _showConfirmError = false;

  /// Whether [PasswordScreen.onSubmit] is still running.
  bool _saving = false;

  /// Why the server turned down the last password.
  String? _serverError;

  /// How long a rule stays on screen, ticked, after it is met.
  static const Duration _metRuleDelay = Duration(milliseconds: 800);

  /// Rules, by index, that are met and have been tucked away.
  final Set<int> _hiddenRules = {};
  final Map<int, Timer> _hideTimers = {};

  String get _password => _passwordController.text;
  String get _confirmation => _confirmController.text;

  String? get _passwordError => validatePassword(_password);
  String? get _confirmError =>
      validatePasswordConfirmation(_password, _confirmation);
  bool get _isValid => _passwordError == null && _confirmError == null;

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(_onPasswordChanged);
    _confirmController.addListener(() => setState(() {}));
    _passwordFocusNode.addListener(_onPasswordFocusChanged);
    _confirmFocusNode.addListener(_onConfirmFocusChanged);
  }

  @override
  void dispose() {
    for (final timer in _hideTimers.values) {
      timer.cancel();
    }
    _passwordController.dispose();
    _confirmController.dispose();
    _passwordFocusNode.dispose();
    _confirmFocusNode.dispose();
    super.dispose();
  }

  /// Hides each rule a moment after it is met, and brings it back as soon
  /// as it is broken again.
  void _onPasswordChanged() {
    _serverError = null;
    for (var i = 0; i < _requirements.length; i++) {
      if (_requirements[i].met(_password)) {
        if (_hiddenRules.contains(i) || _hideTimers.containsKey(i)) continue;
        _hideTimers[i] = Timer(_metRuleDelay, () {
          _hideTimers.remove(i);
          setState(() => _hiddenRules.add(i));
        });
      } else {
        _hideTimers.remove(i)?.cancel();
        _hiddenRules.remove(i);
      }
    }
    setState(() {});
  }

  void _onPasswordFocusChanged() {
    setState(() {
      if (!_passwordFocusNode.hasFocus && _password.isNotEmpty) {
        _showPasswordError = true;
      }
    });
  }

  void _onConfirmFocusChanged() {
    setState(() {
      if (!_confirmFocusNode.hasFocus && _confirmation.isNotEmpty) {
        _showConfirmError = true;
      }
    });
  }

  Future<void> _submit() async {
    if (_saving) return;
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
    setState(() {
      _saving = true;
      _serverError = null;
    });
    final error = await widget.onSubmit?.call(_password);
    if (!mounted) return;
    setState(() {
      _saving = false;
      _serverError = error;
    });
  }

  @override
  Widget build(BuildContext context) {
    final passwordInvalid = _showPasswordError && _passwordError != null;
    // Short phones get tighter gaps so the form fits without scrolling.
    final compact = VerificationScaffold.isCompact(context);

    return VerificationScaffold(
      title: widget.title,
      iconAsset: 'assets/images/secure.png',
      heading: widget.heading,
      subheading: widget.subheading,
      step: widget.step,
      children: [
        const VerificationLabel('New password'),
        const SizedBox(height: 8),
        _PasswordInput(
          controller: _passwordController,
          focusNode: _passwordFocusNode,
          hintText: 'Enter new password',
          hasError: passwordInvalid,
          isValid: _passwordError == null,
          textInputAction: TextInputAction.next,
          onEditingComplete: _confirmFocusNode.requestFocus,
        ),
        SizedBox(height: compact ? 8 : 10),
        _buildRequirements(showMissing: _showPasswordError),
        SizedBox(height: compact ? 10 : 16),
        const VerificationLabel('Confirm password'),
        const SizedBox(height: 8),
        _PasswordInput(
          controller: _confirmController,
          focusNode: _confirmFocusNode,
          hintText: 'Re-enter your password',
          hasError: _confirmProblem != null,
          isValid: _confirmation.isNotEmpty && _confirmError == null,
          textInputAction: TextInputAction.done,
          // Keeps the keyboard open when the password is rejected.
          onEditingComplete: _submit,
        ),
        _buildConfirmStatus(),
        SizedBox(height: compact ? 4 : 12),
        VerificationButton(
          label: widget.buttonLabel,
          active: _isValid && !_saving,
          busy: _saving,
          onPressed: _submit,
        ),
      ],
    );
  }

  /// Why the confirmation is rejected, once that is worth showing: after
  /// the user has left the field or tried to move on, or as soon as they
  /// have typed as much as the password without matching it.
  String? get _confirmProblem {
    final error = _confirmError;
    if (error == null) return null;
    final typedEnough =
        _confirmation.isNotEmpty && _confirmation.length >= _password.length;
    return _showConfirmError || typedEnough ? error : null;
  }

  /// A chip per rule that ticks green once met, then slides away; after a
  /// failed attempt the rules still missing turn red. Once every rule is
  /// met, a single "Strong password" note takes their place.
  ///
  /// The row shrinks as a whole on narrow phones, so every chip keeps the
  /// same size.
  Widget _buildRequirements({required bool showMissing}) {
    final allHidden = _hiddenRules.length == _requirements.length;

    return SizedBox(
      height: 26,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        layoutBuilder: (current, previous) => Stack(
          alignment: Alignment.centerLeft,
          children: [...previous, ?current],
        ),
        child: allHidden
            ? Row(
                key: const ValueKey('strong'),
                children: [
                  const Icon(
                    Icons.verified_user_rounded,
                    size: 16,
                    color: AppColors.green,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    'Strong password',
                    style: appTextStyle(
                      fontSize: 12,
                      weight: FontWeight.w600,
                      color: AppColors.green,
                    ),
                  ),
                ],
              )
            : Align(
                key: const ValueKey('rules'),
                alignment: Alignment.centerLeft,
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (var i = 0; i < _requirements.length; i++)
                        _buildRule(i, showMissing: showMissing),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  /// Rule [i], which fades and folds away sideways once hidden.
  Widget _buildRule(int i, {required bool showMissing}) {
    final requirement = _requirements[i];

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 300),
      transitionBuilder: (child, animation) => FadeTransition(
        opacity: animation,
        alwaysIncludeSemantics: true,
        child: SizeTransition(
          sizeFactor: CurvedAnimation(
            parent: animation,
            curve: Curves.easeInOutCubic,
          ),
          axis: Axis.horizontal,
          child: child,
        ),
      ),
      child: _hiddenRules.contains(i)
          ? SizedBox.shrink(key: ValueKey('hidden$i'))
          : Padding(
              key: ValueKey('rule$i'),
              padding: const EdgeInsets.only(right: 4),
              child: _RequirementChip(
                label: requirement.label,
                name: requirement.name,
                met: requirement.met(_password),
                showMissing: showMissing,
              ),
            ),
    );
  }

  Widget _buildConfirmStatus() {
    final problem = _serverError ?? _confirmProblem;
    final matches = _confirmation.isNotEmpty && _confirmError == null;
    final (text, color) = problem != null
        ? (problem, AppColors.error)
        : matches
        ? ('Passwords match', AppColors.green)
        : (null, AppColors.mutedText);

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

/// Password input styled like the email field, with an eye icon that shows
/// or hides what was typed and a check mark once the value is accepted.
class _PasswordInput extends StatefulWidget {
  const _PasswordInput({
    required this.controller,
    required this.focusNode,
    required this.hintText,
    required this.hasError,
    required this.isValid,
    required this.textInputAction,
    required this.onEditingComplete,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final String hintText;
  final bool hasError;
  final bool isValid;
  final TextInputAction textInputAction;
  final VoidCallback onEditingComplete;

  static const int maxLength = 64;

  @override
  State<_PasswordInput> createState() => _PasswordInputState();
}

class _PasswordInputState extends State<_PasswordInput> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    final focused = widget.focusNode.hasFocus;
    final borderColor = widget.hasError
        ? AppColors.error
        : focused || widget.isValid
        ? AppColors.green
        : AppColors.outline;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 56,
      padding: const EdgeInsets.only(left: 14, right: 4),
      decoration: BoxDecoration(
        color: focused ? AppColors.white : AppColors.paleMint,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: focused ? 2 : 1.5),
      ),
      child: Row(
        children: [
          Icon(
            Icons.lock_outline_rounded,
            size: 22,
            color: focused ? AppColors.green : AppColors.mutedText,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: widget.focusNode,
              obscureText: _obscure,
              keyboardType: TextInputType.visiblePassword,
              textInputAction: widget.textInputAction,
              autocorrect: false,
              enableSuggestions: false,
              autofillHints: const [AutofillHints.newPassword],
              inputFormatters: [
                LengthLimitingTextInputFormatter(_PasswordInput.maxLength),
              ],
              cursorColor: AppColors.green,
              onEditingComplete: widget.onEditingComplete,
              style: appTextStyle(
                fontSize: 15,
                weight: FontWeight.w500,
                color: AppColors.ink,
              ),
              decoration: InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                hintText: widget.hintText,
                hintStyle: appTextStyle(
                  fontSize: 15,
                  weight: FontWeight.w500,
                  color: AppColors.grey,
                ),
              ),
            ),
          ),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            transitionBuilder: (child, animation) => ScaleTransition(
              scale: CurvedAnimation(
                parent: animation,
                curve: Curves.easeOutBack,
              ),
              child: child,
            ),
            child: widget.isValid && !widget.hasError
                ? const Padding(
                    key: ValueKey('valid'),
                    padding: EdgeInsets.only(left: 8),
                    child: Icon(
                      Icons.check_circle_rounded,
                      size: 22,
                      color: AppColors.green,
                    ),
                  )
                : const SizedBox.shrink(key: ValueKey('none')),
          ),
          Semantics(
            button: true,
            label: _obscure ? 'Show password' : 'Hide password',
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => setState(() => _obscure = !_obscure),
              child: SizedBox(
                width: 44,
                height: double.infinity,
                child: Icon(
                  _obscure
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  size: 22,
                  color: AppColors.mutedText,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Small pill for one password rule.
class _RequirementChip extends StatelessWidget {
  const _RequirementChip({
    required this.label,
    required this.name,
    required this.met,
    required this.showMissing,
  });

  final String label;

  /// What screen readers say for the rule.
  final String name;
  final bool met;

  /// Whether an unmet rule is shown in red rather than grey.
  final bool showMissing;

  @override
  Widget build(BuildContext context) {
    final color = met
        ? AppColors.green
        : showMissing
        ? AppColors.error
        : AppColors.mutedText;

    return Semantics(
      label: '$name: ${met ? 'done' : 'missing'}',
      child: ExcludeSemantics(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.fromLTRB(5, 4, 8, 4),
          decoration: BoxDecoration(
            color: met ? AppColors.mint : AppColors.surfaceGrey,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: met ? AppColors.mint : color.withValues(alpha: 0.35),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                transitionBuilder: (child, animation) =>
                    ScaleTransition(scale: animation, child: child),
                child: Icon(
                  met ? Icons.check_circle_rounded : Icons.circle_outlined,
                  key: ValueKey(met),
                  size: 14,
                  color: color,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: appTextStyle(
                  fontSize: 12,
                  weight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
