const { sendEmail } = require('./mailer');

const to = process.argv[2];
if (!to) {
  console.log('Usage: node test-email.js someone@example.com');
  process.exit(1);
}

sendEmail(to, 'CAPartner test email', '<p>If you can read this, email sending works.</p>')
  .then(() => console.log('Email sent. Check the inbox, and the spam folder.'))
  .catch((err) => console.error(err.message));