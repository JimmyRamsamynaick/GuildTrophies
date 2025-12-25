const { Events } = require('discord.js');
const StatsService = require('../services/StatsService');
const TrophyService = require('../services/TrophyService');
const ConfigService = require('../services/ConfigService');

module.exports = {
  name: Events.MessageReactionAdd,
  async execute(reaction, user) {
    if (user.bot || !reaction.message.guild) return;
    
    // Ensure we have the full reaction object if it's partial
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Something went wrong when fetching the message:', error);
        return;
      }
    }

    StatsService.incrementReaction(user.id, reaction.message.guild.id);

    // Check trophies
    const newTrophies = TrophyService.checkAndAward(user.id, reaction.message.guild.id);
    
    if (newTrophies.length > 0) {
      const channelId = ConfigService.getAnnounceChannel(reaction.message.guild.id);
      if (channelId) {
        const channel = reaction.message.guild.channels.cache.get(channelId);
        if (channel) {
          for (const trophy of newTrophies) {
             channel.send(`🎉 Félicitations ${user} ! Tu as débloqué le trophée **${trophy.name}** (${trophy.rarity}) ! 🏆`);
          }
        }
      }
    }
  },
};
