import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/account/account_widgets.dart';
import 'package:capartner/features/account/profile_validators.dart';
import 'package:capartner/features/auth/user_profile.dart';
import 'package:capartner/features/auth/utils/password_validator.dart';
import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// A new password, with the current one that allows the change.
typedef PasswordChange = ({String current, String next});

/// Saves an edited profile, changing the password too when [passwordChange]
/// is given; returns the message to show when it is rejected, or null once
/// saved.
typedef SaveProfileCallback = Future<String?> Function(
  UserProfile profile,
  PasswordChange? passwordChange,
);

/// Edit Profile, opened from the Account tab.
///
/// The name and contact number can be edited; the email only by the admin.
/// The new password follows the same rules as everywhere else and may be
/// left empty to keep the current one, which is needed to change it.
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
  final TextEditingController _currentPasswordController =
      TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  final FocusNode _nameFocusNode = FocusNode();
  final FocusNode _emailFocusNode = FocusNode();
  final FocusNode _currentPasswordFocusNode = FocusNode();
  final FocusNode _passwordFocusNode = FocusNode();
  final FocusNode _contactFocusNode = FocusNode();

  // Errors stay hidden until the user tries to save.
  bool _showErrors = false;

  bool _obscurePassword = true;

  /// Whether [EditProfileScreen.onSave] is still running.
  bool _saving = false;

  /// Message returned by [EditProfileScreen.onSave] for the last attempt.
  String? _rejection;

  String? get _nameError => validateName(_nameController.text);
  String? get _currentPasswordError =>
      _passwordController.text.isNotEmpty &&
          _currentPasswordController.text.isEmpty
      ? 'Enter your current password to change it.'
      : null;
  String? get _passwordError => _passwordController.text.isEmpty
      ? null
      : validatePassword(_passwordController.text);
  String? get _contactError => validateContactNumber(_contactController.text);

  /// Up to two initials from the name being typed, e.g. "JD".
  String get _initials => _nameController.text
      .trim()
      .split(RegExp(r'\s+'))
      .where((word) => word.isNotEmpty)
      .take(2)
      .map((word) => word[0].toUpperCase())
      .join();

  @override
  void initState() {
    super.initState();
    for (final controller in [
      _nameController,
      _currentPasswordController,
      _passwordController,
      _contactController,
    ]) {
      controller.addListener(() => setState(() => _rejection = null));
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _currentPasswordController.dispose();
    _passwordController.dispose();
    _contactController.dispose();
    _nameFocusNode.dispose();
    _emailFocusNode.dispose();
    _currentPasswordFocusNode.dispose();
    _passwordFocusNode.dispose();
    _contactFocusNode.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_saving) return;
    _rejection = null;
    final firstInvalid = _nameError != null
        ? _nameFocusNode
        : _currentPasswordError != null
        ? _currentPasswordFocusNode
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
    setState(() => _saving = true);
    final rejection = await widget.onSave?.call(
      UserProfile(
        name: _nameController.text.trim(),
        email: widget.profile.email,
        contactNumber: _contactController.text.trim(),
        assignedCap: widget.profile.assignedCap,
      ),
      password.isEmpty
          ? null
          : (current: _currentPasswordController.text, next: password),
    );
    if (!mounted) return;
    setState(() {
      _saving = false;
      _rejection = rejection;
    });
    if (rejection == null) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return AccountPageScaffold(
      title: 'Edit Profile',
      subtitle: 'Update your name, login and contact details',
      actions: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (_rejection case final rejection?) _buildRejection(rejection),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 52,
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.darkGreen,
                      side: const BorderSide(
                        color: AppColors.outline,
                        width: 1.5,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Text(
                      'Cancel',
                      style: appTextStyle(
                        fontSize: 15,
                        weight: FontWeight.w800,
                        color: AppColors.darkGreen,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: AccountPrimaryButton(
                  label: 'Save Changes',
                  icon: Icons.check_rounded,
                  busy: _saving,
                  onPressed: _save,
                ),
              ),
            ],
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildAvatar(),
            const SizedBox(height: 24),
            const AccountSectionTitle('PERSONAL DETAILS'),
            AccountCard(
              child: Column(
                children: [
                  _buildField(
                    label: 'Name',
                    icon: Icons.person_outline_rounded,
                    controller: _nameController,
                    focusNode: _nameFocusNode,
                    nextFocusNode: _currentPasswordFocusNode,
                    hintText: 'Enter your name',
                    error: _showErrors ? _nameError : null,
                    keyboardType: TextInputType.name,
                    textCapitalization: TextCapitalization.words,
                    autofillHints: const [AutofillHints.name],
                    maxLength: 60,
                  ),
                  const SizedBox(height: 16),
                  _buildField(
                    label: 'Email',
                    icon: Icons.mail_outline_rounded,
                    controller: _emailController,
                    focusNode: _emailFocusNode,
                    hintText: 'Enter your email',
                    helperText: 'Only your admin can change your email.',
                    error: null,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    maxLength: 254,
                    readOnly: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const AccountSectionTitle('PASSWORD'),
            AccountCard(
              child: Column(
                children: [
                  _buildField(
                    label: 'Current password',
                    icon: Icons.lock_outline_rounded,
                    controller: _currentPasswordController,
                    focusNode: _currentPasswordFocusNode,
                    nextFocusNode: _passwordFocusNode,
                    hintText: 'Needed only to change it',
                    error: _showErrors ? _currentPasswordError : null,
                    keyboardType: TextInputType.visiblePassword,
                    autofillHints: const [AutofillHints.password],
                    maxLength: AuthPasswordField.maxLength,
                    password: true,
                  ),
                  const SizedBox(height: 16),
                  _buildField(
                    label: 'New password',
                    icon: Icons.lock_outline_rounded,
                    controller: _passwordController,
                    focusNode: _passwordFocusNode,
                    nextFocusNode: _contactFocusNode,
                    hintText: 'Leave empty to keep it',
                    helperText:
                        'At least $minPasswordLength characters, with upper and '
                        'lower case, a number and a symbol. A code will be sent '
                        'to your email to confirm it.',
                    error: _showErrors ? _passwordError : null,
                    keyboardType: TextInputType.visiblePassword,
                    autofillHints: const [AutofillHints.newPassword],
                    maxLength: AuthPasswordField.maxLength,
                    password: true,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const AccountSectionTitle('CONTACT'),
            AccountCard(
              child: _buildField(
                label: 'Contact #',
                icon: Icons.call_outlined,
                controller: _contactController,
                focusNode: _contactFocusNode,
                hintText: 'e.g. 09171234567',
                error: _showErrors ? _contactError : null,
                keyboardType: TextInputType.phone,
                autofillHints: const [AutofillHints.telephoneNumber],
                maxLength: 16,
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[0-9+\s-]')),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Why the last save was turned down, above the buttons.
  Widget _buildRejection(String rejection) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Semantics(
        liveRegion: true,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Icon(
              Icons.error_outline_rounded,
              size: 18,
              color: AppColors.error,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                rejection,
                style: appTextStyle(
                  fontSize: 13,
                  lineHeight: 18,
                  weight: FontWeight.w600,
                  color: AppColors.error,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Initials of the name being typed, with the email under them.
  Widget _buildAvatar() {
    final initials = _initials;
    final name = _nameController.text.trim();
    return Column(
      children: [
        Container(
          width: 88,
          height: 88,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.mint,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.white, width: 4),
            boxShadow: [
              BoxShadow(
                color: AppColors.darkGreen.withValues(alpha: 0.18),
                offset: const Offset(0, 8),
                blurRadius: 18,
              ),
            ],
          ),
          child: initials.isEmpty
              ? const Icon(
                  Icons.person_rounded,
                  size: 44,
                  color: AppColors.darkGreen,
                )
              : ExcludeSemantics(
                  child: Text(
                    initials,
                    style: appTextStyle(
                      fontSize: 30,
                      weight: FontWeight.w900,
                      color: AppColors.darkGreen,
                    ),
                  ),
                ),
        ),
        const SizedBox(height: 12),
        // Mirrors the name field, so it is left out for screen readers.
        ExcludeSemantics(
          child: Text(
            name.isEmpty ? 'Your name' : name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: appTextStyle(
              fontSize: 17,
              lineHeight: 22,
              weight: FontWeight.w900,
              color: name.isEmpty ? AppColors.mutedText : AppColors.ink,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildField({
    required String label,
    required IconData icon,
    required TextEditingController controller,
    required FocusNode focusNode,
    required String hintText,
    required String? error,
    required TextInputType keyboardType,
    required Iterable<String> autofillHints,
    required int maxLength,
    FocusNode? nextFocusNode,
    String? helperText,
    bool password = false,
    bool readOnly = false,
    TextCapitalization textCapitalization = TextCapitalization.none,
    List<TextInputFormatter> inputFormatters = const [],
  }) {
    OutlineInputBorder border(Color color, [double width = 1]) =>
        OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: color, width: width),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 6),
          child: Text(
            label,
            style: appTextStyle(
              fontSize: 13,
              lineHeight: 18,
              weight: FontWeight.w700,
              color: AppColors.bodyText,
            ),
          ),
        ),
        TextField(
          controller: controller,
          focusNode: focusNode,
          readOnly: readOnly,
          keyboardType: keyboardType,
          textCapitalization: textCapitalization,
          obscureText: password && _obscurePassword,
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
          style: appTextStyle(
            fontSize: 15,
            weight: FontWeight.w600,
            color: AppColors.ink,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: AppColors.surfaceGrey,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 14,
            ),
            prefixIcon: Icon(icon, size: 20, color: AppColors.mutedText),
            suffixIcon: password
                ? IconButton(
                    tooltip: _obscurePassword
                        ? 'Show password'
                        : 'Hide password',
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      size: 20,
                      color: AppColors.mutedText,
                    ),
                  )
                : null,
            hintText: hintText,
            hintStyle: appTextStyle(
              fontSize: 14,
              weight: FontWeight.w500,
              color: AppColors.mutedText,
            ),
            helperText: helperText,
            helperMaxLines: 2,
            helperStyle: appTextStyle(
              fontSize: 12,
              lineHeight: 16,
              weight: FontWeight.w500,
              color: AppColors.mutedText,
            ),
            errorText: error,
            errorMaxLines: 2,
            errorStyle: appTextStyle(
              fontSize: 12,
              lineHeight: 16,
              weight: FontWeight.w600,
              color: AppColors.error,
            ),
            enabledBorder: border(AppColors.outline),
            focusedBorder: border(AppColors.green, 1.5),
            errorBorder: border(AppColors.error),
            focusedErrorBorder: border(AppColors.error, 1.5),
          ),
        ),
      ],
    );
  }
}
