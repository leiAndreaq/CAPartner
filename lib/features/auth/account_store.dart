import 'package:capartner/features/auth/user_profile.dart';

class _Account {
  _Account({required this.email, required this.password});

  String email;
  String password;
  String name = '';
  String contactNumber = '';

  /// Whether the first-login email verification has been passed.
  bool verifiedOnLogin = false;

  /// Name of the paired Smart Cap, if any.
  String? pairedCap;
}

/// Accounts created on this device.
///
/// Kept in memory only, as a stand-in until there is a backend: everything is
/// forgotten when the app is closed.
class AccountStore {
  final Map<String, _Account> _accounts = {};

  String _key(String email) => email.trim().toLowerCase();

  void register(String email, String password) {
    _accounts[_key(email)] = _Account(email: email.trim(), password: password);
  }

  bool exists(String email) => _accounts.containsKey(_key(email));

  void updatePassword(String email, String password) {
    _accounts[_key(email)]?.password = password;
  }

  bool matches(String email, String password) {
    final account = _accounts[_key(email)];
    return account != null && account.password == password;
  }

  /// Whether [email] has already passed the first-login email verification.
  bool isVerified(String email) =>
      _accounts[_key(email)]?.verifiedOnLogin ?? false;

  void markVerified(String email) {
    _accounts[_key(email)]?.verifiedOnLogin = true;
  }

  /// Name of the Smart Cap paired to [email]'s account, if any.
  String? pairedCap(String email) => _accounts[_key(email)]?.pairedCap;

  void pairCap(String email, String capName) {
    _accounts[_key(email)]?.pairedCap = capName;
  }

  UserProfile profile(String email) {
    final account = _accounts[_key(email)];
    return UserProfile(
      email: account?.email ?? email.trim(),
      name: account?.name ?? '',
      contactNumber: account?.contactNumber ?? '',
    );
  }

  /// Saves [profile] over the account currently under [email], along with
  /// [newPassword] when one is given.
  ///
  /// Returns the message to show when the change is rejected, or null once it
  /// is saved.
  String? updateProfile(
    String email,
    UserProfile profile, {
    String? newPassword,
  }) {
    final account = _accounts[_key(email)];
    if (account == null) return 'This account no longer exists.';

    final newKey = _key(profile.email);
    if (newKey != _key(email)) {
      if (_accounts.containsKey(newKey)) {
        return 'This email is already used by another account.';
      }
      _accounts.remove(_key(email));
      _accounts[newKey] = account;
    }
    account
      ..email = profile.email.trim()
      ..name = profile.name.trim()
      ..contactNumber = profile.contactNumber.trim();
    if (newPassword != null) account.password = newPassword;
    return null;
  }
}
