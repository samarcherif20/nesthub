// ⚠️ TRÈS IMPORTANT : Charger les variables d'environnement pour le token GitHub
require('dotenv').config({ path: '.env.local' });

const { updateUserRiskScore } = require('./lib/risk-scoring/ai-risk-scoring');

// 👇 COLLE L'ID QUE TU AS COPIÉ ICI
const userId = "3435dc94-f452-43ee-987f-5642e6f1539d"; 

async function run() {
  console.log(`🚀 Lancement du scoring IA pour l'utilisateur: ${userId}`);

  try {
    const score = await updateUserRiskScore(userId);
    console.log(`\n✅ TERMINÉ ! Score final: ${score}`);
  } catch (error) {
    console.error(`\n❌ ERREUR: ${error.message}`);
  }

  process.exit(0); // Force l'arrêt du script pour ne pas qu'il reste bloqué
}

run();