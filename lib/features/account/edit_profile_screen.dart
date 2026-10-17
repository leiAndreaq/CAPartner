import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/account/account_widgets.dart';
import 'package:capartner/features/account/profile_validators.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/features/auth/utils/email_validator.dart';
import 'package:capartner/features/auth/utils/password_validator.dart';
import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Saves an edited profile, with [newPassword] when the password was changed;
/// returns the message to show when it is rejected, or null once saved.
typedef SaveProfileCallback = String? Function(
  UserProfile profile,
  String? newPassword,
);

/// Edit Profile, opened from the Account tab.
///
/// Email and password follow the same rules as when creating an account. The
/// password may be left empty to keep the current one.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key, required this.profile, this.onSave});

  final UserProfile profile;
  final SaveProfileCallback? onSave;

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final TextEditingController _nameController = TextEditingController(
    text: widget.profile.name,
  );
  late final TextEditingController _emailController = TextEditingController(
    text: widget.profile.email,
  );
  late final TextEditingController _contactController = TextEditingController(
    text: widget.profile.contactNumber,
  );
  final TextEditingController _passwordController = TextEditingController();

  final FocusNode _nameFocusNode = FocusNode();
  final FocusNode _emailFocusNode = FocusNode();
  final FocusNode _passwordFocusNode = FocusNode();
  final FocusNode _contactFocusNode = FocusNode();

  // Errors stay hidden until the user tries to save.
  bool _showErrors = false;

  /// Message returned by [EditProfileScreen.onSave] for the last attempt.
  String? _rejection;

  String? get _nameError => validateName(_nameController.text);
  String? get _emailError => validateEmail(_emailController.text) ?? _rejection;
  String? get _passwordError => _passwordController.text.isEmpty
      ? null
      : validatePassword(_passwordController.text);
  String? get _contactError => validateContactNumber(_contactController.text);

  @override
  void initState() {
    super.initState();
    for (final controller in [
      _nameController,
      _passwordController,
      _contactController,
    ]) {
      controller.addListener(() => setState(() {}));
    }
    _emailController.addListener(() => setState(() => _rejection = null));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _contactController.dispose();
    _nameFocusNode.dispose();
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    _contactFocusNode.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    _rejection = null;
    final firstInvalid = _nameError != null
        ? _nameFocusNode
        : _emailError != null
        ? _emailFocusNode
        : _passwordError != null
        ? _passwordFocusNode
        : _contactError != null
        ? _contactFocusNode
        : null;
    if (firstInvalid != null) {
      setState(() => _showErrors = true);
      firstInvalid.requestFocus();
      return;
    }

    FocusScope.of(context).unfocus();
    final confirmed = await showConfirmDialog(
      context,
      title: 'Save changes?',
      message: 'Your profile will be updated with the details you entered.',
      confirmLabel: 'Save',
    );
    if (!confirmed || !mounted) return;

    final password = _passwordController.text;
    final rejection = widget.onSave?.call(
      UserProfile(
        name: _nameController.text.trim(),
        email: _emailController.text.trim(),
        contactNumber: _contactController.text.trim(),
      ),
      password.isEmpty ? null : password,
    );
    if (!mounted) return;
    if (rejection != null) {
      setState(() {
        _showErrors = true;
        _rejection = rejection;
      });
      _emailFocusNode.requestFocus();
      return;
    }
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final nameError = _showErrors ? _nameError : null;
    final emailError = _showErrors ? _emailError : null;
    final passwordError = _showErrors ? _passwordError : null;
    final contactError = _showErrors ? _contactError : null;

    return AccountPageScaffold(
      title: 'Edit Profile',
      child: Padding(
        padding: const EdgeInsets.fromLTRB(43, 24, 43, 32),
        child: Column(
          children: [
            Image.asset(
              'assets/images/test_account.png',
              width: 90,
              height: 90,
            ),
            const SizedBox(height: 16),
            _buildLabel('Name'),
            _buildField(
              controller: _nameController,
              focusNode: _nameFocusNode,
              nextFocusNode: _emailFocusNode,
              hintText: 'Enter your name',
              hasError: nameError != null,
              keyboardType: TextInputType.name,
              textCapitalization: TextCapitalization.words,
              autofillHints: const [AutofillHints.name],
              maxLength: 60,
            ),
            AuthErrorText(message: nameError, minHeight: 12),
            _buildLabel('Email'),
            _buildField(
              controller: _emailController,
              focusNode: _emailFocusNode,
              nextFocusNode: _passwordFocusNode,
              hintText: 'Enter your email',
              hasError: emailError != null,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              maxLength: 254,
              inputFormatters: [
                FilteringTextInputFormatter.deny(RegExp(r'\s')),
              ],
            ),
            AuthErrorText(message: emailError, minHeight: 12),
            _buildLabel('Password'),
            AuthPasswordField(
              controller: _passwordController,
              focusNode: _passwordFocusNode,
              hintText: 'New password (leave empty to keep)',
              hintStyle: _hintStyle,
              hasError: passwordError != null,
              autofillHints: const [AutofillHints.newPassword],
              textInputAction: TextInputAction.next,
              onEditingComplete: _contactFocusNode.requestFocus,
            ),
            AuthErrorText(message: passwordError, minHeight: 12),
            _buildLabel('Contact #'),
            _buildField(
              controller: _contactController,
              focusNode: _contactFocusNode,
              hintText: 'e.g. 09171234567',
              hasError: contactError != null,
              keyboardType: TextInputType.phone,
              autofillHints: const [AutofillHints.telephoneNumber],
              maxLength: 16,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9+\s-]')),
              ],
            ),
            AuthErrorText(message: contactError, minHeight: 24),
            AuthButton(label: 'Save Changes', onPressed: _save),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.darkGreen,
                  side: const BorderSide(color: AppColors.darkGreen, width: 2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  textStyle: authTextStyle(
                    fontSize: 16,
                    weight: FontWeight.w700,
                  ),
                ),
                child: const Text('Cancel'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  TextStyle get _hintStyle => authTextStyle(
    fontSize: 14,
    weight: FontWeight.w300,
    color: AppColors.greyGreen,
  );

  Widget _buildLabel(String text) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Text(
          text,
          style: authTextStyle(
            fontSize: 14,
            lineHeight: 20,
            weight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required FocusNode focusNode,
    required String hintText,
    required bool hasError,
    required TextInputType keyboardType,
    required Iterable<String> autofillHints,
    required int maxLength,
    FocusNode? nextFocusNode,
    TextCapitalization textCapitalization = TextCapitalization.none,
    List<TextInputFormatter> inputFormatters = const [],
  }) {
    return AuthInputBox(
      height: 44,
      hasError: hasError,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18),
        child: Center(
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            keyboardType: keyboardType,
            textCapitalization: textCapitalization,
            textInputAction: nextFocusNode == null
                ? TextInputAction.done
                : TextInputAction.next,
            autocorrect: false,
            enableSuggestions: false,
            autofillHints: autofillHints,
            inputFormatters: [
              ...inputFormatters,
              LengthLimitingTextInputFormatter(maxLength),
            ],
            cursorColor: AppColors.darkGreen,
            onEditingComplete: nextFocusNode == null
                ? _save
                : nextFocusNode.requestFocus,
            style: authTextStyle(fontSize: 14, weight: FontWeight.w500),
            decoration: InputDecoration(
              isCollapsed: true,
              border: InputBorder.none,
              hintText: hintText,
              hintStyle: _hintStyle,
            ),
          ),
        ),
      ),
    );
  }
}
