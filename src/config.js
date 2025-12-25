require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.CLIENT_ID || '',
  dbPath: './trophies.db',
  rarityEmojis: {
    BRONZE: process.env.BRONZE_EMOJI || '<:trophybronze:1453779318936440863>',
    SILVER: process.env.SILVER_EMOJI || '<:trophyargent:1453779320316104786>',
    GOLD: process.env.GOLD_EMOJI || '<:trophyor:1453779321666666690>',
    PLATINUM: process.env.PLATINUM_EMOJI || '<:trophyplatine:1453779322530828461>'
  }
};
