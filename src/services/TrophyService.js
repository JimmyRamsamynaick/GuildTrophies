const { db } = require('../database/db');
const { TROPHIES, TrophyType } = require('../data/trophies');
const StatsService = require('./StatsService');

class TrophyService {
  static checkAndAward(userId, guildId) {
    // CHANGE: Use Lifetime Stats instead of Period Stats
    const stats = StatsService.getAllStatsForUser(userId); 
    const unlockedNow = [];

    // Get already unlocked trophies
    const unlockedIds = db.prepare('SELECT trophy_id FROM user_trophies WHERE user_id = ? AND guild_id = ?').all(userId, guildId);
    const unlockedSet = new Set(unlockedIds.map(u => u.trophy_id));

    // Optimization: Don't iterate 20,000 trophies every message.
    // Check only relevant types based on what triggered the check? 
    // For now, JS is fast enough for 20k loops, but let's filter if needed later.
    // Better: We know the current stats. We can filter trophies that are close or passed.
    // But simplest is just iterate.
    
    // To avoid lag, we could wrap this in setImmediate or process later, 
    // but for < 50k items simple loop is < 10ms.

    for (const trophy of TROPHIES) {
      if (unlockedSet.has(trophy.id)) continue;

      let passed = false;
      // Note: stats from 'users' table are total_messages, total_voice_seconds, total_reactions
      if (trophy.type === TrophyType.MESSAGE_COUNT && stats.total_messages >= trophy.threshold) passed = true;
      if (trophy.type === TrophyType.VOICE_TIME && stats.total_voice_seconds >= trophy.threshold) passed = true;
      if (trophy.type === TrophyType.REACTION_COUNT && stats.total_reactions >= trophy.threshold) passed = true;

      if (passed) {
        db.prepare('INSERT INTO user_trophies (user_id, guild_id, trophy_id, unlocked_at) VALUES (?, ?, ?, ?)').run(userId, guildId, trophy.id, new Date().toISOString());
        unlockedNow.push(trophy);
      }
    }

    return unlockedNow;
  }

  static getUserTrophies(userId, guildId) {
    const rows = db.prepare('SELECT trophy_id, unlocked_at FROM user_trophies WHERE user_id = ? AND guild_id = ?').all(userId, guildId);
    
    // Need to handle if trophy def is missing (though with algorithmic they shouldn't disappear)
    const trophies = [];
    const trophyMap = new Map(TROPHIES.map(t => [t.id, t]));

    for (const row of rows) {
        const def = trophyMap.get(row.trophy_id);
        if (def) {
            trophies.push({ ...def, unlockedAt: row.unlocked_at });
        }
    }
    return trophies;
  }

  static getLeaderboard(guildId) {
      const rows = db.prepare(`
        SELECT user_id, COUNT(trophy_id) as count 
        FROM user_trophies 
        WHERE guild_id = ? 
        GROUP BY user_id 
        ORDER BY count DESC 
        LIMIT 10
      `).all(guildId);
      return rows;
  }
}

module.exports = TrophyService;
