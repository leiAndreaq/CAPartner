/// What a user can edit about themselves on the Account tab.
class UserProfile {
  const UserProfile({
    required this.email,
    this.name = '',
    this.contactNumber = '',
    this.assignedCap = '',
  });

  final String email;
  final String name;
  final String contactNumber;

  /// Code of the Smart Cap the admin assigned to this account, e.g.
  /// "CAP-001"; empty when none is assigned yet. Only this cap can be paired.
  final String assignedCap;
}
