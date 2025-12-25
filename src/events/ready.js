const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    client.user.setPresence({
      activities: [{
        name: 'Regarde ton profil pour obtenir des trophées — Débloque des trophées avec messages, réactions et vocal',
        type: ActivityType.Streaming,
        url: 'https://twitch.tv/jimmy_9708'
      }],
      status: 'online'
    });
  },
};
