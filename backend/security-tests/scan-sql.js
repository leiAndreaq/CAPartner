// Static check: finds every ${...} placed inside a SQL template string in the backend code.
// SQL strings in this code base start with an UPPER-CASE keyword, so error messages are not scanned.
// Safe interpolations are only: a column name taken from a fixed list in the code, or a placeholder number ($1, $2...).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sqlString = new RegExp('`(\\s*(?:SELECT|UPDATE|INSERT|DELETE)\\b[^`]*)`', 'g');
const interpolation = new RegExp('\\$\\{([^}]+)\\}', 'g');

function scan() {
  const files = [
    ...fs.readdirSync(path.join(root, 'routes')).map((f) => path.join(root, 'routes', f)),
    ...['auth.js', 'otp.js', 'audit.js'].map((f) => path.join(root, f)),
  ];
  const found = [];
  let sqlStrings = 0;
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(sqlString)) {
      sqlStrings++;
      for (const x of match[1].matchAll(interpolation)) {
        found.push({ file: path.basename(file), code: x[1].trim() });
      }
    }
  }
  return { sqlStrings, found };
}

// What is allowed to be glued into SQL: fixed column names and placeholder numbers only.
const SAFE = [/^column$/, /^sets\.join\(/, /^keys\.length \+ 1$/, /^changes\.map\(/];
const isSafe = (code) => SAFE.some((rule) => rule.test(code));

module.exports = { scan, isSafe };

if (require.main === module) {
  const { sqlStrings, found } = scan();
  console.log(`SQL strings scanned: ${sqlStrings}`);
  for (const f of found) console.log(`${isSafe(f.code) ? 'ok     ' : 'REVIEW '} ${f.file}: \${${f.code}}`);
}
