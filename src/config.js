require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  dbPath: './trophies.db',
  rarityEmojis: {
    BRONZE: process.env.BRONZE_EMOJI || '🥉',
    SILVER: process.env.SILVER_EMOJI || '🥈',
    GOLD: process.env.GOLD_EMOJI || '🥇',
    PLATINUM: process.env.PLATINUM_EMOJI || '💎'
  }
};
