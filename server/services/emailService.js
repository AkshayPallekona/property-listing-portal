const nodemailer = require('nodemailer');

let transporter;
if (process.env.EMAIL_MODE === 'smtp' && process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.EMAIL_MODE === 'console' || !transporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service not configured for production');
    }
    console.log('\n========== DEV ONLY EMAIL ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log('====================================\n');
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
};

const sendPasswordReset = async (email, token) => {
  const link = `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:5000'}/pages/reset-password.html?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    text: `Click the link to reset your password (expires in 30 min): ${link}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Click <a href="${link}">here</a> to reset your password. Link expires in 30 minutes.</p><p>If you did not request this, ignore this email.</p>`,
  });
};

module.exports = { sendEmail, sendPasswordReset };
