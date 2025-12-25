const { db } = require('../database/db');

class ConfigService {
  static setAnnounceChannel(guildId, channelId) {
    db.prepare(`
      INSERT INTO guild_config (guild_id, announce_channel_id) 
      VALUES (?, ?) 
      ON CONFLICT(guild_id) DO UPDATE SET announce_channel_id = ?
    `).run(guildId, channelId, channelId);
  }

  static getAnnounceChannel(guildId) {
    const row = db.prepare('SELECT announce_channel_id FROM guild_config WHERE guild_id = ?').get(guildId);
    return row ? row.announce_channel_id : null;
  }

  static setPeriodType(guildId, type) {
    db.prepare(`
      INSERT INTO guild_config (guild_id, period_type) 
      VALUES (?, ?) 
      ON CONFLICT(guild_id) DO UPDATE SET period_type = ?
    `).run(guildId, type, type);
  }

  static getPeriodType(guildId) {
    const row = db.prepare('SELECT period_type FROM guild_config WHERE guild_id = ?').get(guildId);
    return row ? row.period_type : 'MONTHLY';
  }

  static getLastProcessedPeriod(guildId) {
    const row = db.prepare('SELECT last_processed_period FROM guild_config WHERE guild_id = ?').get(guildId);
    return row ? row.last_processed_period : null;
  }

  static setLastProcessedPeriod(guildId, periodKey) {
    db.prepare(`
      INSERT INTO guild_config (guild_id, last_processed_period)
      VALUES (?, ?)
      ON CONFLICT(guild_id) DO UPDATE SET last_processed_period = ?
    `).run(guildId, periodKey, periodKey);
  }
}

module.exports = ConfigService;
