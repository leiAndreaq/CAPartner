require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendEmail(to, subject, htmlContent) {
  return transporter.sendMail({
    from: '"CAPartner" <' + process.env.GMAIL_USER + '>',
    to: to,
    subject: subject,
    html: htmlContent,
  });
}

module.exports = { sendEmail };