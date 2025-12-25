const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, ChannelType } = require('discord.js');
const cron = require('node-cron');
const config = require('./config');
const { initDatabase } = require('./database/db');
const ConfigService = require('./services/ConfigService');
const StatsService = require('./services/StatsService');

// Initialize Database
initDatabase();

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ] 
});

client.commands = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Load Events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Cron Job for Period Checks (Reset/Recap)
// Run every minute to check if period changed
cron.schedule('* * * * *', async () => {
  console.log('Running periodic check...');
  client.guilds.cache.forEach(async (guild) => {
    try {
      guild.channels.cache.forEach((channel) => {
        if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
          channel.members.forEach((member) => {
            if (member.user.bot) return;
            StatsService.addVoiceTime(member.id, guild.id, 60);
          });
        }
      });
    } catch (e) {
      console.error('Voice accrual error:', e);
    }
    const currentPeriod = StatsService.getPeriodKey(guild.id);
    const lastProcessed = ConfigService.getLastProcessedPeriod(guild.id);

    if (lastProcessed && lastProcessed !== currentPeriod) {
        // Period changed! Generate recap for previous period.
        const announceChannelId = ConfigService.getAnnounceChannel(guild.id);
        
        // Fetch stats for the period that just ended (lastProcessed)
        const stats = StatsService.getPeriodTotals(guild.id, lastProcessed);
        
        // Use cached member count (no intent required)
        const memberCount = guild.memberCount || 0;

        if (announceChannelId) {
            const channel = guild.channels.cache.get(announceChannelId);
            if (channel) {
                const embed = {
                    color: 0xFF0000, // Red for reset/recap
                    title: `📅 Récapitulatif de la période (${lastProcessed})`,
                    description: "Voici les statistiques du serveur pour la période écoulée :",
                    fields: [
                        { name: "📨 Messages Totaux", value: `${stats.total_messages || 0}`, inline: true },
                        { name: "🗣️ Heures Vocales", value: `${Math.floor((stats.total_voice || 0) / 3600)}h`, inline: true },
                        { name: "👥 Membres Totaux", value: `${memberCount}`, inline: true },
                        { name: "🔄 Reset", value: "Les statistiques mensuelles ont été réinitialisées pour la nouvelle période !", inline: false }
                    ],
                    footer: { text: "TrophyHall Bot" },
                    timestamp: new Date()
                };
                
                channel.send({ embeds: [embed] });
            }
        }
        
        ConfigService.setLastProcessedPeriod(guild.id, currentPeriod);
    } else if (!lastProcessed) {
        // First run initialization
        ConfigService.setLastProcessedPeriod(guild.id, currentPeriod);
    }
  });
});

client.on('error', (error) => {
  console.error('Discord Client Error:', error);
});

client.login(config.token);
