final RegExp _separators = RegExp(r'[\s-]');
final RegExp _mobileNumberPattern = RegExp(r'^(09|\+639)\d{9}$');

/// Returns the message to show for [input], or null when it is a usable name.
String? validateName(String input) {
  final name = input.trim();
  if (name.isEmpty) {
    return 'Please enter your name.';
  }
  if (name.length < 2) {
    return 'Name is too short.';
  }
  return null;
}

/// Returns the message to show for [input], or null when it is empty or a
/// Philippine mobile number. Spaces and dashes are ignored.
String? validateContactNumber(String input) {
  final number = input.replaceAll(_separators, '');
  if (number.isEmpty || _mobileNumberPattern.hasMatch(number)) {
    return null;
  }
  return 'Enter a valid mobile number, e.g. 09171234567.';
}
