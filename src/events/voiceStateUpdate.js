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
      voiceStates.delete(userId);
    }
    // User switched channels - treat as leave then join? Or just ignore if same guild?
    // If we want to be precise about "time in voice", switching channels is continuous. 
    // If they leave voice completely, that's when we count.
    // However, if the bot restarts, we lose the start time. 
    // For robustness, maybe update periodically? But for simplicity, let's keep it on Leave.
  },
};
