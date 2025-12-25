const Database = require('better-sqlite3');
const config = require('../config');

const db = new Database(config.dbPath);

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      total_messages INTEGER DEFAULT 0,
      total_voice_seconds INTEGER DEFAULT 0,
      total_reactions INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS monthly_stats (
      user_id TEXT,
      guild_id TEXT, 
      period_key TEXT,
      messages INTEGER DEFAULT 0,
      voice_seconds INTEGER DEFAULT 0,
      reactions INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id, period_key)
    );

    CREATE TABLE IF NOT EXISTS user_trophies (
      user_id TEXT,
      guild_id TEXT,
      trophy_id TEXT,
      unlocked_at TEXT,
      PRIMARY KEY (user_id, guild_id, trophy_id)
    );

    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      announce_channel_id TEXT,
      period_type TEXT DEFAULT 'MONTHLY', -- MONTHLY, WEEKLY, DAILY
      last_processed_period TEXT
    );
  `);
  
  console.log('Database initialized.');
}

module.exports = {
  db,
  initDatabase
};
