const { SlashCommandBuilder } = require('discord.js');
const ConfigService = require('../services/ConfigService');
const StatsService = require('../services/StatsService');
const TrophyService = require('../services/TrophyService');
const { TROPHIES } = require('../data/trophies');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trophy')
    .setDescription('Commandes principales pour TrophyHall')
    .addSubcommand(sub => 
      sub.setName('profile')
        .setDescription('Voir le profil et les trophées')
        .addUserOption(option => option.setName('user').setDescription('L\'utilisateur à voir').setRequired(false))
    )
    .addSubcommand(sub => 
      sub.setName('leaderboard')
        .setDescription('Voir le classement des trophées')
    )
    .addSubcommand(sub => 
      sub.setName('trophies')
        .setDescription('Voir la liste de tous les trophées disponibles')
        .addIntegerOption(option => 
            option.setName('page')
            .setDescription('Numéro de la page')
            .setMinValue(1)
        )
    )
    .addSubcommand(sub => 
      sub.setName('config')
        .setDescription('Configurer le bot (Admin)')
        .addChannelOption(option => option.setName('announce_channel').setDescription('Salon pour les annonces'))
    )
    .addSubcommand(sub =>
        sub.setName('set-period')
        .setDescription('Changer la période de reset (Admin)')
        .addStringOption(option => 
            option.setName('type')
            .setDescription('Type de période')
            .setRequired(true)
            .addChoices(
                { name: 'Minutes (Test)', value: 'MINUTE' },
                { name: 'Heures', value: 'HOUR' },
                { name: 'Journalier', value: 'DAILY' },
                { name: 'Hebdomadaire (7 jours)', value: 'WEEKLY' },
                { name: 'Bi-hebdomadaire (14 jours)', value: 'BIWEEKLY' },
                { name: 'Mensuel', value: 'MONTHLY' },
                { name: 'Trimestriel (3 mois)', value: 'QUARTERLY' },
                { name: 'Annuel', value: 'YEARLY' }
            )
        )
    )
    .addSubcommand(sub => 
      sub.setName('test-recap')
        .setDescription('Tester l\'envoi du récapitulatif (Admin)')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    if (subcommand === 'profile') {
      const user = interaction.options.getUser('user') || interaction.user;
      const stats = StatsService.getPeriodStats(user.id, guildId);
      const trophies = TrophyService.getUserTrophies(user.id, guildId);
      
      const counts = {
        'Bronze': 0,
        'Argent': 0,
        'Or': 0,
        'Platine': 0
      };

      let highestRarity = null;
      const rarityOrder = ['Bronze', 'Argent', 'Or', 'Platine'];

      trophies.forEach(t => {
        if (counts[t.rarity] !== undefined) {
            counts[t.rarity]++;
        }
        if (!highestRarity || rarityOrder.indexOf(t.rarity) > rarityOrder.indexOf(highestRarity)) {
            highestRarity = t.rarity;
        }
      });

      const config = require('../config');
      const summary = `${config.rarityEmojis.BRONZE} Bronze: ${counts['Bronze']} | ${config.rarityEmojis.SILVER} Argent: ${counts['Argent']} | ${config.rarityEmojis.GOLD} Or: ${counts['Or']} | ${config.rarityEmojis.PLATINUM} Platine: ${counts['Platine']}`;

      let thumbnailUrl = user.displayAvatarURL({ size: 128 });

      const embed = {
        color: 0xFFD700,
        title: `🏆 Profil de ${user.username}`,
        fields: [
          { name: '📊 Stats de la période', value: `Messages: ${stats.messages}\nVocal: ${Math.floor(stats.voiceSeconds / 60)} min\nRéactions: ${stats.reactions}`, inline: false },
          { name: '🏅 Trophées', value: summary, inline: false }
        ],
        thumbnail: { url: thumbnailUrl }
      };

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'leaderboard') {
      const leaderboard = TrophyService.getLeaderboard(guildId);
      
      const fields = [];
      for (const [index, entry] of leaderboard.entries()) {
        try {
            const user = await interaction.client.users.fetch(entry.user_id);
            fields.push({ name: `#${index + 1} ${user.username}`, value: `${entry.count} trophées`, inline: false });
        } catch (e) {
            fields.push({ name: `#${index + 1} Inconnu`, value: `${entry.count} trophées`, inline: false });
        }
      }

      const embed = {
        color: 0xFFD700,
        title: '🏆 Classement des Trophées',
        description: fields.length ? null : 'Aucune donnée.',
        fields: fields
      };

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'trophies') {
        const page = interaction.options.getInteger('page') || 1;
        const itemsPerPage = 20;
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const totalPages = Math.ceil(TROPHIES.length / itemsPerPage);

        if (page > totalPages) {
             return interaction.reply({ content: `❌ Page invalide. Il y a ${totalPages} pages.`, ephemeral: true });
        }

        const currentTrophies = TROPHIES.slice(start, end);

        const footerText = page < totalPages 
            ? `Utilisez /trophy trophies page:${page + 1} pour voir la suite`
            : `Dernière page (${page}/${totalPages})`;

        const embed = {
            color: 0x0099FF,
            title: `📜 Liste des Trophées Disponibles (Page ${page}/${totalPages})`,
            description: `Total: ${TROPHIES.length} trophées`,
            fields: currentTrophies.map(t => ({
                name: `${t.name} (${t.rarity})`,
                value: `${t.description} (Seuil: ${t.threshold})`,
                inline: false
            })),
            footer: { text: footerText }
        };
        await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'config') {
      if (!interaction.member.permissions.has('Administrator')) {
        return interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', ephemeral: true });
      }

      const channel = interaction.options.getChannel('announce_channel');
      if (channel) {
        ConfigService.setAnnounceChannel(guildId, channel.id);
        await interaction.reply({ content: `✅ Salon d'annonce configuré sur ${channel}`, ephemeral: true });
      } else {
        await interaction.reply({ content: 'Veuillez spécifier un salon.', ephemeral: true });
      }
    } else if (subcommand === 'set-period') {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', ephemeral: true });
        }
        const type = interaction.options.getString('type');
        ConfigService.setPeriodType(guildId, type);
        await interaction.reply({ content: `✅ Période changée à : ${type}. Les stats seront reset selon ce nouveau cycle.`, ephemeral: true });
    } else if (subcommand === 'test-recap') {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({ content: '❌ Vous devez être administrateur pour utiliser cette commande.', ephemeral: true });
        }
        
        // Defer reply to prevent timeout
        await interaction.deferReply();

        try {
            // Manual trigger of the recap logic
            const currentPeriod = StatsService.getPeriodKey(guildId);
            // We use currentPeriod as the "target" for the test, assuming we want to see stats for NOW
            const stats = StatsService.getPeriodTotals(guildId, currentPeriod);
            
            // Use cached member count (no intent required)
            const memberCount = interaction.guild.memberCount || 0;

            const embed = {
                color: 0xFF0000,
                title: `📅 Test Récapitulatif (${currentPeriod})`,
                description: "Ceci est un test de l'embed de récapitulatif.",
                fields: [
                    { name: "📨 Messages Totaux", value: `${stats.total_messages || 0}`, inline: true },
                    { name: "🗣️ Heures Vocales", value: `${Math.floor((stats.total_voice || 0) / 3600)}h`, inline: true },
                    { name: "👥 Membres Totaux", value: `${memberCount}`, inline: true },
                    { name: "ℹ️ Note", value: "Ceci est une simulation manuelle.", inline: false }
                ],
                footer: { text: "TrophyHall Bot" },
                timestamp: new Date()
            };

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Une erreur est survenue lors de la génération du récapitulatif.' });
        }
    }
  }
};
