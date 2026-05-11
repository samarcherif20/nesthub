const { PrismaClient } = require('@prisma/client');
const { updateUserRiskScore } = require('../lib/risk-scoring/ai-risk-scoring');
const { updateListingTrustScore } = require('../lib/risk-scoring/ai-listing-scoring');

const prisma = new PrismaClient();

async function updateAllUserScores() {
  console.log('👥 Mise à jour scores utilisateurs...');
  
  const users = await prisma.user.findMany({
    where: { 
      status: { in: ['ACTIVE', 'PENDING_VALIDATION'] }
    },
    select: { id: true, email: true },
    take: 20 // Limite pour éviter timeout
  });
  
  console.log(`📊 ${users.length} utilisateurs trouvés`);
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`[${i+1}/${users.length}] Analyse ${user.email}...`);
    
    try {
      await updateUserRiskScore(user.id);
      // Pause de 2s entre chaque appel pour éviter rate limit
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`❌ Erreur ${user.email}:`, error.message);
    }
  }
}

async function updateAllListingScores() {
  console.log('\n🏠 Mise à jour scores annonces...');
  
  const listings = await prisma.listing.findMany({
    where: { 
      status: { in: ['ACTIVE', 'PENDING_REVIEW'] }
    },
    select: { id: true, title: true },
    take: 20
  });
  
  console.log(`📊 ${listings.length} annonces trouvées`);
  
  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    console.log(`[${i+1}/${listings.length}] Analyse "${listing.title}"...`);
    
    try {
      await updateListingTrustScore(listing.id);
      await new Promise(r => setTimeout(r, 2000));
    } catch (error) {
      console.error(`❌ Erreur ${listing.title}:`, error.message);
    }
  }
}

async function updateTopPriorityScores() {
  console.log('🎯 Mise à jour priorité haute...');
  
  // Utilisateurs avec des réservations récentes
  const activeUsers = await prisma.user.findMany({
    where: {
      tenantBookings: {
        some: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 derniers jours
        }
      }
    },
    select: { id: true, email: true },
    take: 10
  });
  
  // Annonces avec réservations récentes
  const activeListings = await prisma.listing.findMany({
    where: {
      bookings: {
        some: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      }
    },
    select: { id: true, title: true },
    take: 10
  });
  
  console.log(`🔥 ${activeUsers.length} utilisateurs actifs + ${activeListings.length} annonces actives`);
  
  for (const user of activeUsers) {
    await updateUserRiskScore(user.id);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  for (const listing of activeListings) {
    await updateListingTrustScore(listing.id);
    await new Promise(r => setTimeout(r, 1000));
  }
}

async function main() {
  console.log('🚀 Script de mise à jour des scores IA\n');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--users-only')) {
    await updateAllUserScores();
  } else if (args.includes('--listings-only')) {
    await updateAllListingScores();
  } else if (args.includes('--priority')) {
    await updateTopPriorityScores();
  } else {
    // Mode complet par défaut
    await updateAllUserScores();
    await updateAllListingScores();
  }
  
  console.log('\n✅ Mise à jour terminée');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });