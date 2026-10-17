const int _maxEmailLength = 254;
const int _maxLocalPartLength = 64;

final RegExp _localPartPattern = RegExp(r"^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+$");
final RegExp _domainLabelPattern = RegExp(
  r'^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$',
);
final RegExp _topLevelDomainPattern = RegExp(r'^[A-Za-z]{2,}$');

/// Email providers an account can be registered with.
const Set<String> _supportedDomains = {
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.com.ph',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'gov.com',
  'gov.ph',
};

/// Government agencies have their own subdomain, e.g. dilg.gov.ph.
const List<String> _supportedDomainSuffixes = ['.gov.ph', '.gov.com'];

/// Returns the message to show for [input], or null when it is a valid email
/// from a supported provider.
///
/// Leading and trailing whitespace is ignored.
String? validateEmail(String input) {
  final email = input.trim();
  if (email.isEmpty) {
    return 'Please enter your email address.';
  }

  final at = email.indexOf('@');
  if (at == -1) {
    return 'Email address must include "@".';
  }
  if (at != email.lastIndexOf('@')) {
    return 'Email address can only have one "@".';
  }

  final localPart = email.substring(0, at);
  final domain = email.substring(at + 1);
  if (localPart.isEmpty) {
    return 'Enter the name before "@".';
  }
  if (domain.isEmpty) {
    return 'Enter the domain after "@", e.g. gmail.com.';
  }
  if (email.length > _maxEmailLength ||
      localPart.length > _maxLocalPartLength) {
    return 'Email address is too long.';
  }

  // Splitting on dots also rejects leading, trailing and doubled dots.
  if (!localPart.split('.').every(_localPartPattern.hasMatch)) {
    return 'Please enter a valid email address.';
  }

  final labels = domain.split('.');
  if (labels.length < 2) {
    return 'Enter a complete domain, e.g. gmail.com.';
  }
  if (!labels.every(_domainLabelPattern.hasMatch) ||
      !_topLevelDomainPattern.hasMatch(labels.last)) {
    return 'Please enter a valid email address.';
  }

  if (!_isSupportedDomain(domain.toLowerCase())) {
    return 'Use an email like @gmail.com or @yahoo.com.';
  }

  return null;
}

bool _isSupportedDomain(String domain) {
  return _supportedDomains.contains(domain) ||
      _supportedDomainSuffixes.any(domain.endsWith);
}
