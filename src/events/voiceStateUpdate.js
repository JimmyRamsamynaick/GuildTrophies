const { Events } = require('discord.js');
const StatsService = require('../services/StatsService');
const TrophyService = require('../services/TrophyService');
const ConfigService = require('../services/ConfigService');

const voiceStates = new Map(); // Map<userId, startTime>

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    const userId = newState.member.id;
    const guildId = newState.guild.id;
    
    // User joined a channel
    if (!oldState.channelId && newState.channelId) {
      voiceStates.set(userId, Date.now());
    }
    // User left a channel
    else if (oldState.channelId && !newState.channelId) {
      const startTime = voiceStates.get(userId);
      if (startTime) {
        const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
        voiceStates.delete(userId);
        
        if (durationSeconds > 0) {
            StatsService.addVoiceTime(userId, guildId, durationSeconds);
            
            // Check trophies
            const newTrophies = TrophyService.checkAndAward(userId, guildId);
            if (newTrophies.length > 0) {
                const channelId = ConfigService.getAnnounceChannel(guildId);
                if (channelId) {
                    const channel = newState.guild.channels.cache.get(channelId);
                    if (channel) {
                        for (const trophy of newTrophies) {
                            channel.send(`🎉 Félicitations <@${userId}> ! Tu as débloqué le trophée **${trophy.name}** (${trophy.rarity}) ! 🏆`);
                        }
                    }
                }
            }
        }
      }
    }
    // User switched channels - treat as leave then join? Or just ignore if same guild?
    // If we want to be precise about "time in voice", switching channels is continuous. 
    // If they leave voice completely, that's when we count.
    // However, if the bot restarts, we lose the start time. 
    // For robustness, maybe update periodically? But for simplicity, let's keep it on Leave.
  },
};
