import 'package:capartner/features/auth/user_profile.dart';

class _Account {
  _Account(this.profile);

  UserProfile profile;

  /// Name of the paired Smart Cap, if any.
  String? pairedCap;
}

/// What the app keeps about accounts that have logged in on this device.
///
/// The profile is a copy of what the server has. The paired cap is kept here
/// in memory only, until the server takes it, and is forgotten when the app
/// is closed.
class AccountStore {
  final Map<String, _Account> _accounts = {};

  String _key(String email) => email.trim().toLowerCase();

  /// Adds the account behind [profile], fresh from the server, or updates the
  /// one already here.
  void signIn(UserProfile profile) {
    final account = _accounts[_key(profile.email)];
    if (account == null) {
      _accounts[_key(profile.email)] = _Account(profile);
    } else {
      account.profile = profile;
    }
  }

  /// Name of the Smart Cap paired to [email]'s account, if any.
  String? pairedCap(String email) => _accounts[_key(email)]?.pairedCap;

  void pairCap(String email, String capName) {
    _accounts[_key(email)]?.pairedCap = capName;
  }

  UserProfile profile(String email) =>
      _accounts[_key(email)]?.profile ?? UserProfile(email: email.trim());

  /// Keeps [profile], as saved on the server, for the account under its
  /// email.
  void saveProfile(UserProfile profile) {
    _accounts[_key(profile.email)]?.profile = profile;
  }
}
