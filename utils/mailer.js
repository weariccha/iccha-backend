const nodemailer = require("nodemailer");

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendResetEmail(toEmail, resetUrl) {
  const transporter = getTransporter();

  // No SMTP configured yet — log the link instead of failing.
  // Useful while you're testing before email sending is set up.
  if (!transporter) {
    console.log(`[mailer] SMTP not configured. Reset link for ${toEmail}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"ICCHA" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Reset your ICCHA password",
    html: `
      <p>You requested a password reset for your ICCHA account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a> (this link expires in 1 hour).</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

module.exports = { sendResetEmail };
