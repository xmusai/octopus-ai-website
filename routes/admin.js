const express   = require('express');
const router    = express.Router();
const { getDB } = require('../db');

// ── Auth middleware ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ── Stats ─────────────────────────────────────────────────────────
router.get('/stats', requireAuth, (_req, res) => {
  const db = getDB();
  res.json({
    total:     db.prepare('SELECT COUNT(*) as n FROM leads').get().n,
    new:       db.prepare("SELECT COUNT(*) as n FROM leads WHERE status='new'").get().n,
    contacted: db.prepare("SELECT COUNT(*) as n FROM leads WHERE status='contacted'").get().n,
    qualified: db.prepare("SELECT COUNT(*) as n FROM leads WHERE status='qualified'").get().n,
    closed:    db.prepare("SELECT COUNT(*) as n FROM leads WHERE status='closed'").get().n,
    today:     db.prepare("SELECT COUNT(*) as n FROM leads WHERE DATE(created_at)=DATE('now')").get().n,
    week:      db.prepare("SELECT COUNT(*) as n FROM leads WHERE created_at >= DATE('now','-7 days')").get().n,
  });
});

// ── List leads ────────────────────────────────────────────────────
router.get('/leads', requireAuth, (req, res) => {
  const db = getDB();
  const { status, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const where  = status ? 'WHERE status = ?' : '';
  const args   = status ? [status] : [];

  const leads = db
    .prepare(`SELECT * FROM leads ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...args, Number(limit), offset);

  const { n: total } = db.prepare(`SELECT COUNT(*) as n FROM leads ${where}`).get(...args);

  res.json({ leads, total, page: Number(page), limit: Number(limit) });
});

// ── Update lead ───────────────────────────────────────────────────
router.patch('/leads/:id', requireAuth, (req, res) => {
  const { status, notes } = req.body;
  const db = getDB();
  const sets = [];
  const vals = [];

  if (status !== undefined) { sets.push('status = ?'); vals.push(status); }
  if (notes  !== undefined) { sets.push('notes = ?');  vals.push(notes);  }
  if (!sets.length) return res.status(400).json({ error: 'Nothing to update.' });

  sets.push('updated_at = CURRENT_TIMESTAMP');
  vals.push(Number(req.params.id));

  db.prepare(`UPDATE leads SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  res.json({ success: true });
});

// ── Delete lead ───────────────────────────────────────────────────
router.delete('/leads/:id', requireAuth, (req, res) => {
  getDB().prepare('DELETE FROM leads WHERE id = ?').run(Number(req.params.id));
  res.json({ success: true });
});

// ── Export CSV ────────────────────────────────────────────────────
router.get('/export', requireAuth, (_req, res) => {
  const db   = getDB();
  const rows = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
  const esc  = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const csv = [
    'ID,Name,Email,Company,Service,Message,Status,Notes,IP,Created At',
    ...rows.map((r) =>
      [
        r.id, esc(r.name), esc(r.email), esc(r.company), esc(r.service),
        esc(r.message), r.status, esc(r.notes), r.ip_address, r.created_at,
      ].join(',')
    ),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="octopusai-leads-${Date.now()}.csv"`);
  res.send(csv);
});

module.exports = router;
