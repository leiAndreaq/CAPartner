const int minPasswordLength = 8;

final RegExp _uppercasePattern = RegExp(r'[A-Z]');
final RegExp _lowercasePattern = RegExp(r'[a-z]');
final RegExp _digitPattern = RegExp(r'[0-9]');
final RegExp _specialPattern = RegExp(r'[^A-Za-z0-9\s]');

/// Returns the message to show for [password], or null when it is strong
/// enough.
String? validatePassword(String password) {
  if (password.isEmpty) {
    return 'Please enter a password.';
  }
  if (password.length < minPasswordLength) {
    return 'Use at least $minPasswordLength characters.';
  }
  if (!_uppercasePattern.hasMatch(password)) {
    return 'Add at least one uppercase letter (A-Z).';
  }
  if (!_lowercasePattern.hasMatch(password)) {
    return 'Add at least one lowercase letter (a-z).';
  }
  if (!_digitPattern.hasMatch(password)) {
    return 'Add at least one number (0-9).';
  }
  if (!_specialPattern.hasMatch(password)) {
    return 'Add at least one special character, e.g. ! @ # \$.';
  }
  return null;
}

/// Returns the message to show for the repeated [confirmation], or null when
/// it matches [password].
String? validatePasswordConfirmation(String password, String confirmation) {
  if (confirmation.isEmpty) {
    return 'Please confirm your password.';
  }
  if (confirmation != password) {
    return 'Passwords do not match.';
  }
  return null;
}
