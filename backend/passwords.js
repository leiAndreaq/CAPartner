// Password rules (strong password check) and random temporary passwords.
const crypto = require('crypto');

const MIN_LENGTH = 10;
const MAX_LENGTH = 72; // bcrypt only reads the first 72 characters

// Returns a message saying what is wrong, or null if the password is strong.
function checkStrength(password, email) {
  if (typeof password !== 'string' || password.length < MIN_LENGTH) {
    return `Password must be at least ${MIN_LENGTH} characters.`;
  }
  if (password.length > MAX_LENGTH) return `Password must be at most ${MAX_LENGTH} characters.`;
  if (!/[A-Z]/.test(password)) return 'Password needs at least 1 capital letter.';
  if (!/[a-z]/.test(password)) return 'Password needs at least 1 small letter.';
  if (!/[0-9]/.test(password)) return 'Password needs at least 1 number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password needs at least 1 symbol, like ! # @.';
  if (email && password.trim().toLowerCase() === String(email).trim().toLowerCase()) {
    return 'Password cannot be the same as the email.';
  }
  return null;
}

// 12 random characters with at least one of each kind. Look-alike characters (0/O, 1/l/I) are left out.
function makeTempPassword() {
  const groups = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!#@$%*?'];
  const all = groups.join('');
  const chars = groups.map((g) => g[crypto.randomInt(g.length)]);
  while (chars.length < 12) chars.push(all[crypto.randomInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

module.exports = { checkStrength, makeTempPassword };
