const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendNotification({ name, email, company, service, message }) {
  if (!process.env.SMTP_USER) return; // Email not configured — skip silently

  const t = createTransporter();
  const to = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;

  await t.sendMail({
    from: `"Octopus AI Website" <${process.env.SMTP_USER}>`,
    to,
    subject: `🦑 New Lead: ${name}${company ? ` — ${company}` : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f7f7f7;border-radius:8px">
        <h2 style="color:#cc7700;margin:0 0 24px;font-size:20px">New Contact Form Submission</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;background:#fff;border-radius:6px;overflow:hidden">
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:12px 16px;font-weight:600;color:#555;width:110px">Name</td>
            <td style="padding:12px 16px">${name}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:12px 16px;font-weight:600;color:#555">Email</td>
            <td style="padding:12px 16px"><a href="mailto:${email}" style="color:#cc7700;text-decoration:none">${email}</a></td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:12px 16px;font-weight:600;color:#555">Company</td>
            <td style="padding:12px 16px">${company || '—'}</td>
          </tr>
          <tr style="border-bottom:1px solid #eee">
            <td style="padding:12px 16px;font-weight:600;color:#555">Service</td>
            <td style="padding:12px 16px">${service || '—'}</td>
          </tr>
          <tr>
            <td style="padding:12px 16px;font-weight:600;color:#555;vertical-align:top">Message</td>
            <td style="padding:12px 16px;white-space:pre-wrap;line-height:1.6">${message}</td>
          </tr>
        </table>
        <p style="margin:20px 0 0;color:#aaa;font-size:12px">Submitted at ${new Date().toLocaleString()}</p>
      </div>
    `,
  });
}

async function sendConfirmation({ name, email }) {
  if (!process.env.SMTP_USER) return;

  const t = createTransporter();

  await t.sendMail({
    from: `"Octopus AI" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `We got your message — Octopus AI`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#000;color:#fff;padding:48px;border-radius:12px">
        <p style="color:#ffaa00;font-size:11px;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 28px">Octopus AI</p>
        <h1 style="font-size:26px;font-weight:500;margin:0 0 16px;color:#fff">Thanks, ${name}!</h1>
        <p style="color:rgba(255,255,255,0.65);line-height:1.75;margin:0 0 16px">
          We've received your message and will get back to you within <strong style="color:#fff">24 hours</strong>.
        </p>
        <p style="color:rgba(255,255,255,0.65);line-height:1.75;margin:0 0 40px">
          In the meantime, reach us directly at
          <a href="mailto:hello@octopusai.com" style="color:#ffaa00;text-decoration:none">hello@octopusai.com</a>.
        </p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:0 0 24px">
        <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:0">© 2025 Octopus AI · All rights reserved</p>
      </div>
    `,
  });
}

module.exports = { sendNotification, sendConfirmation };
