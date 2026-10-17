/// What a user can edit about themselves on the Account tab.
class UserProfile {
  const UserProfile({
    required this.email,
    this.name = '',
    this.contactNumber = '',
  });

  final String email;
  final String name;
  final String contactNumber;
}
