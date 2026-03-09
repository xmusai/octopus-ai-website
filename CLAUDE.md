# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Run the server (production)
npm start

# Run the server (development, auto-restarts on file change)
npm run dev

# Kill any process on port 3000 and restart
kill $(lsof -ti:3000) && npm start
```

## Architecture

This is a single-file marketing website (`index.html`) backed by a Node.js/Express server. There is no build step — everything is served statically from the root directory.

**Request flow:**
- `server.js` serves `index.html` as a static file and mounts two API routers
- `POST /api/contact` → `routes/contact.js` → validates input, writes to SQLite, fires emails
- `GET|PATCH|DELETE /api/admin/*` → `routes/admin.js` → requires `Authorization: Bearer <ADMIN_TOKEN>`
- `GET /admin` → serves `admin.html` (the lead management dashboard)

**Database:**
- Uses Node's built-in `node:sqlite` module (no npm package, requires Node ≥ 22.5)
- `db.js` initializes a single `leads` table; `getDB()` returns a singleton connection
- In production the DB path is controlled by the `DB_PATH` env var (set to `/app/data/octopusai.db` on Railway so it lands on the persistent volume)

**Email:**
- `email.js` uses Nodemailer with SMTP credentials from env vars
- Two emails sent per submission: admin notification + client confirmation
- Email is silently skipped if `SMTP_USER` is not set

**Frontend contact form:**
- All CTA buttons call `openModal()` (defined in the inline `<script>` at the bottom of `index.html`)
- The modal `<div id="contact-modal">` is placed *after* the `</script>` tag, so all event listeners use **event delegation on `document`** rather than direct `getElementById` calls at script-load time
- Form submits via `fetch('/api/contact', ...)` — requires the server to be running

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Server port (default: 3000) |
| `ADMIN_TOKEN` | Bearer token for `/api/admin/*` routes |
| `DB_PATH` | SQLite file path (default: `__dirname/octopusai.db`) |
| `SMTP_HOST/PORT/SECURE` | SMTP server config |
| `SMTP_USER/PASS` | SMTP credentials |
| `NOTIFY_EMAIL` | Where lead alert emails are sent |

Copy `.env.example` to `.env` for local development.

## Deployment

Hosted on Railway. Pushing to `main` on GitHub (`xmusai/octopus-ai-website`) triggers an automatic redeploy. A Railway Volume is mounted at `/app/data` to persist the SQLite database across deploys.
