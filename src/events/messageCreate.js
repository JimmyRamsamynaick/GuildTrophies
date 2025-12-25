const { Events } = require('discord.js');
const StatsService = require('../services/StatsService');
const TrophyService = require('../services/TrophyService');
const ConfigService = require('../services/ConfigService');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    StatsService.incrementMessage(message.author.id, message.guild.id);
    
    // Check trophies
    const newTrophies = TrophyService.checkAndAward(message.author.id, message.guild.id);
    
    if (newTrophies.length > 0) {
      const channelId = ConfigService.getAnnounceChannel(message.guild.id);
      if (channelId) {
        const channel = message.guild.channels.cache.get(channelId);
        if (channel) {
          for (const trophy of newTrophies) {
             channel.send(`🎉 Félicitations ${message.author} ! Tu as débloqué le trophée **${trophy.name}** (${trophy.rarity}) ! 🏆`);
          }
        }
      }
    }
  },
};
