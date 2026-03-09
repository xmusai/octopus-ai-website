const express = require('express');
const router = express.Router();
const validator = require('validator');
const { getDB } = require('../db');
const { sendNotification, sendConfirmation } = require('../email');

router.post('/', async (req, res) => {
  try {
    const { name = '', email = '', company = '', service = '', message = '' } = req.body;

    // ── Validation ────────────────────────────────────────────────
    if (!name.trim() || !email.trim() || !message.trim()) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (name.length > 120 || email.length > 200 || company.length > 200 || message.length > 5000) {
      return res.status(400).json({ error: 'One or more fields exceed the maximum length.' });
    }

    // ── Sanitise ──────────────────────────────────────────────────
    const lead = {
      name: validator.escape(name.trim()),
      email: validator.normalizeEmail(email.trim()) || email.trim(),
      company: validator.escape(company.trim()),
      service: service.trim().slice(0, 200),
      message: validator.escape(message.trim()),
      ip: (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(),
    };

    // ── Persist ───────────────────────────────────────────────────
    const db = getDB();
    const { lastInsertRowid } = db
      .prepare(
        'INSERT INTO leads (name, email, company, service, message, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(lead.name, lead.email, lead.company, lead.service, lead.message, lead.ip);

    // ── Emails (non-blocking) ─────────────────────────────────────
    Promise.all([sendNotification(lead), sendConfirmation(lead)]).catch((err) =>
      console.error('[email error]', err.message)
    );

    res.json({
      success: true,
      message: "Message received! We'll be in touch within 24 hours.",
      id: lastInsertRowid,
    });
  } catch (err) {
    console.error('[contact error]', err);
    res.status(500).json({ error: 'Server error. Please try again or email us directly at hello@ai4business.com.' });
  }
});

module.exports = router;
