import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/account/account_widgets.dart';
import 'package:capartner/features/account/profile_validators.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Saves an edited name and contact number with the backend; completes with
/// the message to show when it is rejected, or null once saved.
typedef SaveProfileCallback = Future<String?> Function(UserProfile profile);

/// Edit Profile, opened from the Account tab.
///
/// Name and contact number are saved right away. The email can only be changed
/// by the admin. The password is changed on its own screen (current password +
/// email code), opened with [onChangePassword].
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({
    super.key,
    required this.profile,
    this.onSave,
    this.onChangePassword,
  });

  final UserProfile profile;
  final SaveProfileCallback? onSave;
  final VoidCallback? onChangePassword;

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

  final FocusNode _nameFocusNode = FocusNode();
  final FocusNode _emailFocusNode = FocusNode();
  final FocusNode _contactFocusNode = FocusNode();

  // Errors stay hidden until the user tries to save.
  bool _showErrors = false;

  /// True while waiting for the backend's answer.
  bool _busy = false;

  /// Message returned by [EditProfileScreen.onSave] for the last attempt.
  String? _rejection;

  String? get _nameError => validateName(_nameController.text);
  String? get _contactError =>
      validateContactNumber(_contactController.text) ?? _rejection;

  @override
  void initState() {
    super.initState();
    _nameController.addListener(() => setState(() => _rejection = null));
    _contactController.addListener(() => setState(() => _rejection = null));
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _contactController.dispose();
    _nameFocusNode.dispose();
    _emailFocusNode.dispose();
    _contactFocusNode.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_busy) return;
    _rejection = null;
    final firstInvalid = _nameError != null
        ? _nameFocusNode
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

    setState(() => _busy = true);
    final rejection = await widget.onSave?.call(
      UserProfile(
        name: _nameController.text.trim(),
        email: widget.profile.email,
        contactNumber: _contactController.text.trim(),
      ),
    );
    if (!mounted) return;
    setState(() => _busy = false);
    if (rejection != null) {
      setState(() {
        _showErrors = true;
        _rejection = rejection;
      });
      _contactFocusNode.requestFocus();
      return;
    }
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final nameError = _showErrors ? _nameError : null;
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
              nextFocusNode: _contactFocusNode,
              hintText: 'Enter your email',
              hasError: false,
              readOnly: true,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              maxLength: 254,
            ),
            Padding(
              padding: const EdgeInsets.only(top: 4, bottom: 12),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Only your station admin can change your email.',
                  style: authTextStyle(
                    fontSize: 11,
                    weight: FontWeight.w500,
                    color: AppColors.greyGreen,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ),
            _buildLabel('Password'),
            SizedBox(
              width: double.infinity,
              height: 44,
              child: OutlinedButton.icon(
                onPressed: widget.onChangePassword,
                icon: const Icon(Icons.lock_outline, size: 18),
                label: const Text('Change Password'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.darkGreen,
                  side: const BorderSide(color: AppColors.darkGreen, width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  textStyle: authTextStyle(fontSize: 14, weight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(height: 12),
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
            AuthButton(
              label: _busy ? 'Saving...' : 'Save Changes',
              active: !_busy,
              onPressed: _save,
            ),
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
    bool readOnly = false,
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
            readOnly: readOnly,
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
            style: authTextStyle(
              fontSize: 14,
              weight: FontWeight.w500,
              color: readOnly ? AppColors.greyGreen : AppColors.darkGreen,
            ),
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
