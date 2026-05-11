const { updateUserRiskScore } = require('../lib/risk-scoring/ai-risk-scoring');
const { updateListingTrustScore } = require('../lib/risk-scoring/ai-listing-scoring');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test utilisateur avec un vrai utilisateur de ta DB
async function testUserScoring() {
  console.log('🧪 TEST - Scoring utilisateur...');
  
  try {
    // Prendre le premier utilisateur actif
    const user = await prisma.user.findFirst({
      where: { status: 'ACTIVE' }
    });
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé pour le test');
      return;
    }
    
    console.log(`📊 Test avec l'utilisateur: ${user.email}`);
    const score = await updateUserRiskScore(user.id);
    console.log(`✅ Score utilisateur: ${score}`);
    
  } catch (error) {
    console.error('❌ Erreur test utilisateur:', error.message);
  }
}

// Test annonce avec une vraie annonce de ta DB
async function testListingScoring() {
  console.log('\n🧪 TEST - Scoring annonce...');
  
  try {
    // Prendre la première annonce active
    const listing = await prisma.listing.findFirst({
      where: { status: 'ACTIVE' }
    });
    
    if (!listing) {
      console.log('❌ Aucune annonce trouvée pour le test');
      return;
    }
    
    console.log(`🏠 Test avec l'annonce: ${listing.title}`);
    const score = await updateListingTrustScore(listing.id);
    console.log(`✅ Score annonce: ${score}`);
    
  } catch (error) {
    console.error('❌ Erreur test annonce:', error.message);
  }
}

// Test des cas de modération
async function testModerationCases() {
  console.log('\n🧪 TEST - Cas de modération...');
  
  const testCases = [
    "Mon numéro c'est le 22 345 678",
    "تواصل معي على واتساب", 
    "zéro deux quarante six trente",
    "contact@example.com",
    "Prix: 200TND/nuit, très bel appartement"
  ];
  
  console.log('📝 Cas de test préparés:', testCases.length);
  console.log('💡 Pour tester la modération, utilise ton interface chat avec ces messages');
}

// Lance tous les tests
async function runAllTests() {
  console.log('🚀 Début des tests de scoring IA...\n');
  
  await testUserScoring();
  await testListingScoring();
  await testModerationCases();
  
  console.log('\n✅ Tests terminés');
  process.exit(0);
}

runAllTests();