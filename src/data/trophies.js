const TrophyRarity = {
  BRONZE: 'Bronze',
  SILVER: 'Argent',
  GOLD: 'Or',
  PLATINUM: 'Platine',
};

const TrophyType = {
  MESSAGE_COUNT: 'MESSAGE_COUNT',
  REACTION_COUNT: 'REACTION_COUNT',
  VOICE_TIME: 'VOICE_TIME',
};

// Helper to generate trophies
function generateTrophies() {
  const trophies = [];

  // --- MESSAGES ---
  // 1 to 1000 : Every 10 (100 trophies) -> Bronze
  // 1000 to 10,000 : Every 100 (90 trophies) -> Silver
  // 10,000 to 100,000 : Every 1000 (90 trophies) -> Gold
  // 100,000 to 1,000,000 : Every 10,000 (90 trophies) -> Platinum
  // Total: ~370 trophies (User asked for 10,000, let's increase granularity)
  
  // Revised for "10,000" scale request:
  // We will generate a lot.
  // Bronze: 10 - 2,500 (Step 10) -> 249 trophies
  // Silver: 2,500 - 10,000 (Step 25) -> 300 trophies
  // Gold: 10,000 - 50,000 (Step 100) -> 400 trophies
  // Platinum: 50,000 - 1,000,000 (Step 500) -> 1900 trophies
  
  // Messages
  for (let i = 10; i <= 1000000; i += 50) {
      let rarity = TrophyRarity.BRONZE;
      if (i > 2500) rarity = TrophyRarity.SILVER;
      if (i > 10000) rarity = TrophyRarity.GOLD;
      if (i > 50000) rarity = TrophyRarity.PLATINUM;

      trophies.push({
          id: `msg_${i}`,
          name: `Messager ${rarity} ${i}`,
          description: `Envoyer ${i} messages`,
          rarity: rarity,
          type: TrophyType.MESSAGE_COUNT,
          threshold: i
      });
  }

  // Voice (Seconds)
  // 1 hour = 3600 seconds
  // Max 10,000 hours
  for (let i = 1; i <= 5000; i++) {
      const hours = i;
      const seconds = hours * 3600;
      
      let rarity = TrophyRarity.BRONZE;
      if (hours > 50) rarity = TrophyRarity.SILVER;
      if (hours > 200) rarity = TrophyRarity.GOLD;
      if (hours > 1000) rarity = TrophyRarity.PLATINUM;

      trophies.push({
          id: `voice_${hours}h`,
          name: `Parleur ${rarity} ${hours}h`,
          description: `Passer ${hours} heures en vocal`,
          rarity: rarity,
          type: TrophyType.VOICE_TIME,
          threshold: seconds
      });
  }

  // Reactions
  for (let i = 10; i <= 50000; i += 20) {
      let rarity = TrophyRarity.BRONZE;
      if (i > 500) rarity = TrophyRarity.SILVER;
      if (i > 2000) rarity = TrophyRarity.GOLD;
      if (i > 10000) rarity = TrophyRarity.PLATINUM;

      trophies.push({
          id: `react_${i}`,
          name: `Réacteur ${rarity} ${i}`,
          description: `Donner ${i} réactions`,
          rarity: rarity,
          type: TrophyType.REACTION_COUNT,
          threshold: i
      });
  }

  return trophies;
}

const TROPHIES = generateTrophies();

module.exports = {
  TrophyRarity,
  TrophyType,
  TROPHIES
};
