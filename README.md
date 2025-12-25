# 🏆 TrophyHall Bot

Bot Discord de gestion de trophées et statistiques serveur.

## 📋 Fonctionnalités

- **Suivi des statistiques** : Messages, temps vocal, réactions.
- **Trophées** : Déblocage automatique de succès selon des seuils.
- **Périodicité** : Reset automatique (Mensuel par défaut, configurable).
- **Profils** : Visualisation des trophées et stats.
- **Classements** : Leaderboard des membres les plus titrés.

## 🛠 Architecture

### Structure des dossiers
```
src/
├── commands/       # Commandes Slash (trophy.js)
├── database/       # Configuration SQLite et initialisation
├── events/         # Gestionnaires d'événements Discord (message, voice, etc.)
├── services/       # Logique métier (Stats, Trophées, Config)
├── data/           # Données statiques (Liste des trophées)
├── utils/          # Scripts utilitaires (deploy-commands)
├── config.js       # Configuration globale
└── index.js        # Point d'entrée du bot
```

### Schéma de Base de Données (SQLite)

- **users** : Stats globales (total).
- **monthly_stats** : Stats par période (mois/semaine) pour le reset.
  - `user_id`, `guild_id`, `period_key` (ex: 2023-10), `messages`, `voice_seconds`, `reactions`
- **user_trophies** : Trophées débloqués par les utilisateurs.
- **guild_config** : Configuration par serveur (salon d'annonce, type de période).

## ⚡ Événements Discord Utilisés

- `messageCreate` : Compte les messages envoyés.
- `voiceStateUpdate` : Calcule le temps passé en vocal (à la déconnexion).
- `messageReactionAdd` : Compte les réactions ajoutées.
- `interactionCreate` : Gère les commandes slash.
- `ready` : Initialisation du bot.

## 🎮 Commandes Slash

Toutes les commandes sont sous le préfixe `/trophy`.

- `/trophy profile [user]` : Affiche les stats et trophées d'un membre.
- `/trophy leaderboard` : Affiche le top 10 des chasseurs de trophées.
- `/trophy trophies` : Liste tous les trophées disponibles et leurs conditions.
- `/trophy config` (Admin) : Définit le salon d'annonce des trophées.
- `/trophy set-period` (Admin) : Change la fréquence de reset (Mensuel/Hebdo/Journalier).

## 🚀 Installation et Déploiement

1. **Prérequis**
   - Node.js v16+
   - NPM

2. **Installation**
   ```bash
   git clone <repo_url>
   cd GuildTrophies
   npm install
   ```

3. **Configuration**
   Remplissez le fichier `.env` :
   ```env
   DISCORD_TOKEN=votre_token
   CLIENT_ID=votre_app_id
   ```

4. **Déploiement des commandes**
   ```bash
   npm run deploy
   ```

5. **Lancement**
   ```bash
   npm start
   # ou pour le développement
   npm run dev
   ```

## 🧪 Tests

Vous pouvez changer la période en "Journalier" via `/trophy set-period type:Journalier` pour tester le reset automatique plus rapidement.

## 👤 Auteur

JimmyRamsamynaick (jimmyramsamynaick@gmail.com)
