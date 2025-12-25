const { db } = require('../database/db');
const ConfigService = require('./ConfigService');

class StatsService {
  static getPeriodKey(guildId) {
    const type = ConfigService.getPeriodType(guildId);
    const date = new Date();
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()));

    if (type === 'MINUTE') {
      // YYYY-MM-DD-HH-mm
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}-${String(date.getMinutes()).padStart(2, '0')}`;
    } else if (type === 'HOUR') {
      // YYYY-MM-DD-HH
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
    } else if (type === 'DAILY') {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else if (type === 'WEEKLY') {
      // YYYY-Www
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
      return `${d.getUTCFullYear()}-W${weekNo}`;
    } else if (type === 'BIWEEKLY') {
      // YYYY-Www (Every 2 weeks). 
      // Simplified: Just use week number divided by 2
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
      const biWeekNo = Math.ceil(weekNo / 2);
      return `${d.getUTCFullYear()}-BW${biWeekNo}`;
    } else if (type === 'MONTHLY') {
       return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else if (type === 'QUARTERLY') {
       // YYYY-Qx
       const q = Math.floor(date.getMonth() / 3) + 1;
       return `${date.getFullYear()}-Q${q}`;
    } else if (type === 'YEARLY') {
       return `${date.getFullYear()}`;
    } else {
      // MONTHLY default
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  // Not strictly used by cron anymore (uses lastProcessed check) but useful for debug or future
  static getPreviousPeriodKey(guildId) {
    const type = ConfigService.getPeriodType(guildId);
    // ... skipping implementation as it's complex and not currently used by the cron job ...
    return 'UNKNOWN'; 
  }

  static ensureUserExists(userId, guildId) {
    db.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').run(userId);
    
    const periodKey = this.getPeriodKey(guildId);
    db.prepare('INSERT OR IGNORE INTO monthly_stats (user_id, guild_id, period_key) VALUES (?, ?, ?)').run(userId, guildId, periodKey);
  }

  static incrementMessage(userId, guildId) {
    this.ensureUserExists(userId, guildId);
    const periodKey = this.getPeriodKey(guildId);

    const info = db.transaction(() => {
      db.prepare('UPDATE users SET total_messages = total_messages + 1 WHERE id = ?').run(userId);
      db.prepare('UPDATE monthly_stats SET messages = messages + 1 WHERE user_id = ? AND guild_id = ? AND period_key = ?').run(userId, guildId, periodKey);
    })();
  }

  static addVoiceTime(userId, guildId, seconds) {
    this.ensureUserExists(userId, guildId);
    const periodKey = this.getPeriodKey(guildId);

    db.transaction(() => {
      db.prepare('UPDATE users SET total_voice_seconds = total_voice_seconds + ? WHERE id = ?').run(seconds, userId);
      db.prepare('UPDATE monthly_stats SET voice_seconds = voice_seconds + ? WHERE user_id = ? AND guild_id = ? AND period_key = ?').run(seconds, userId, guildId, periodKey);
    })();
  }

  static incrementReaction(userId, guildId) {
    this.ensureUserExists(userId, guildId);
    const periodKey = this.getPeriodKey(guildId);

    db.transaction(() => {
      db.prepare('UPDATE users SET total_reactions = total_reactions + 1 WHERE id = ?').run(userId);
      db.prepare('UPDATE monthly_stats SET reactions = reactions + 1 WHERE user_id = ? AND guild_id = ? AND period_key = ?').run(userId, guildId, periodKey);
    })();
  }

  static getPeriodStats(userId, guildId) {
    const periodKey = this.getPeriodKey(guildId);
    const row = db.prepare('SELECT messages, voice_seconds, reactions FROM monthly_stats WHERE user_id = ? AND guild_id = ? AND period_key = ?').get(userId, guildId, periodKey);
    
    if (!row) return { messages: 0, voiceSeconds: 0, reactions: 0 };
    return { messages: row.messages, voiceSeconds: row.voice_seconds, reactions: row.reactions };
  }

  static getAllPeriodStats(guildId) {
    const periodKey = this.getPeriodKey(guildId);
    return db.prepare('SELECT * FROM monthly_stats WHERE guild_id = ? AND period_key = ?').all(guildId, periodKey);
  }

  static getPeriodTotals(guildId, periodKey) {
      const row = db.prepare(`
        SELECT 
            SUM(messages) as total_messages, 
            SUM(voice_seconds) as total_voice, 
            SUM(reactions) as total_reactions 
        FROM monthly_stats 
        WHERE guild_id = ? AND period_key = ?
      `).get(guildId, periodKey);
      
      return row || { total_messages: 0, total_voice: 0, total_reactions: 0 };
  }

  static getAllStatsForUser(userId) {
     const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
     if (!row) return { total_messages: 0, total_voice_seconds: 0, total_reactions: 0 };
     return row;
  }
}

module.exports = StatsService;
