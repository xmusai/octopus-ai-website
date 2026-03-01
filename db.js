// Uses Node.js built-in SQLite (available in Node 22.5+, no npm install needed)
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

let db;

function getDB() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(__dirname, 'octopusai.db');
    db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
  }
  return db;
}

function initDB() {
  const database = getDB();
  database.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      email      TEXT    NOT NULL,
      company    TEXT    DEFAULT '',
      service    TEXT    DEFAULT '',
      message    TEXT    NOT NULL,
      ip_address TEXT    DEFAULT '',
      status     TEXT    DEFAULT 'new',
      notes      TEXT    DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('✓ Database ready (octopusai.db)');
}

module.exports = { getDB, initDB };
