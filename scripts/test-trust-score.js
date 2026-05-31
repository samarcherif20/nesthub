// scripts/test-trust-score.js
// Test du calcul du trust score pour une annonce spécifique
require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { updateListingTrustScore, refreshAllListingsTrustScores } = require("../lib/risk-scoring/ai-listing-scoring");
// IDs des annonces de test (à modifier avec les vrais IDs de ta base)
const TEST_LISTING_IDS = [
  "cmnrwuepk0019up1o8xkxyu1h", 
  "cmp9g5rv30000upp8oktphnlj"  
];

// Fonction pour lister toutes les annonces disponibles
async function listAllListings() {
  console.log("\n📋 LISTE DES ANNONCES DISPONIBLES :\n");
  
  const listings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      type: true,
      governorate: true,
      trustScore: true,
      trustLabel: true,
      createdAt: true
    },
    take: 20,
    orderBy: { createdAt: "desc" }
  });
  
  console.log("ID | Titre | Type | Gouvernorat | Score actuel");
  console.log("---|------|------|-------------|-------------");
  listings.forEach(l => {
    console.log(`${l.id} | ${l.title.substring(0, 30)} | ${l.type} | ${l.governorate} | ${l.trustScore || "Non calculé"}`);
  });
  
  return listings;
}

// Fonction pour tester une annonce spécifique
async function testSingleListing(listingId, forceRefresh = true) {
  console.log(`\n🔍 TEST POUR L'ANNONCE: ${listingId}\n`);
  console.log("=".repeat(80));
  
  // Récupérer l'annonce avant calcul
  const beforeListing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      title: true,
      description: true,
      type: true,
      governorate: true,
      delegation: true,
      pricePerNight: true,
      status: true,
      trustScore: true,
      trustLabel: true,
      trustBadge: true,
      scamProbability: true,
      scamFlags: true,
      lastScoredAt: true,
      viewCount: true,
      bookingCount: true,
      favoriteCount: true,
      rooms: true,
      bathrooms: true,
      maxGuests: true,
      photos: { select: { url: true, isMain: true } },
      owner: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          isIdentityVerified: true,
          isEmailVerified: true,
          isPhoneVerified: true
        }
      }
    }
  });
  
  if (!beforeListing) {
    console.log(`❌ Annonce ${listingId} non trouvée !`);
    return;
  }
  
  console.log("\n📊 AVANT CALCUL :");
  console.log(`   Titre: ${beforeListing.title}`);
  console.log(`   Type: ${beforeListing.type}`);
  console.log(`   Localisation: ${beforeListing.governorate} > ${beforeListing.delegation}`);
  console.log(`   Prix/nuit: ${beforeListing.pricePerNight || "Non défini"} TND`);
  console.log(`   Score actuel: ${beforeListing.trustScore || "Non calculé"}`);
  console.log(`   Label: ${beforeListing.trustLabel || "Non défini"}`);
  console.log(`   Dernier calcul: ${beforeListing.lastScoredAt || "Jamais"}`);
  console.log(`   Propriétaire: ${beforeListing.owner.firstName} ${beforeListing.owner.lastName}`);
  console.log(`   Vérifié: ID:${beforeListing.owner.isIdentityVerified ? "✅" : "❌"} Email:${beforeListing.owner.isEmailVerified ? "✅" : "❌"} Tél:${beforeListing.owner.isPhoneVerified ? "✅" : "❌"}`);
  console.log(`   Photos: ${beforeListing.photos.length}`);
  console.log(`   Statistiques: ${beforeListing.viewCount} vues | ${beforeListing.bookingCount} résas | ${beforeListing.favoriteCount} favoris`);
  
  console.log("\n🔄 CALCUL DU TRUST SCORE EN COURS...\n");
  
  const startTime = Date.now();
  const newScore = await updateListingTrustScore(listingId, forceRefresh);
  const endTime = Date.now();
  
  console.log(`\n⏱️ Temps d'exécution: ${(endTime - startTime) / 1000} secondes`);
  
  // Récupérer l'annonce après calcul
  const afterListing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      trustScore: true,
      trustLabel: true,
      trustBadge: true,
      scamProbability: true,
      scamFlags: true,
      lastScoredAt: true
    }
  });
  
  console.log("\n📊 APRÈS CALCUL :");
  console.log(`   ✅ Nouveau score: ${afterListing.trustScore}/100`);
  console.log(`   🏷️ Label: ${afterListing.trustLabel}`);
  console.log(`   🎨 Badge: ${afterListing.trustBadge}`);
  console.log(`   ⚠️ Probabilité arnaque: ${afterListing.scamProbability}%`);
  console.log(`   🚩 Flags: ${afterListing.scamFlags?.length > 0 ? afterListing.scamFlags.join(", ") : "Aucun"}`);
  console.log(`   📅 Calculé le: ${afterListing.lastScoredAt}`);
  
  // Comparaison
  console.log("\n📈 ÉVOLUTION :");
  const oldScore = beforeListing.trustScore || 0;
  const scoreDiff = newScore - oldScore;
  console.log(`   Score: ${oldScore} → ${newScore} (${scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff})`);
  
  if (newScore >= 86) {
    console.log("   🟢 EXCELLENTE - Annonce de très haute qualité");
  } else if (newScore >= 71) {
    console.log("   🔵 FIABLE - Bonne annonce digne de confiance");
  } else if (newScore >= 51) {
    console.log("   ⚪ CORRECTE - Annonce standard acceptable");
  } else if (newScore >= 31) {
    console.log("   🟠 INCOMPLÈTE - Nécessite des améliorations");
  } else {
    console.log("   🔴 SUSPECTE - Vérification recommandée");
  }
  
  console.log("\n" + "=".repeat(80));
  return newScore;
}

// Fonction pour tester plusieurs annonces
async function testMultipleListings(listingIds, forceRefresh = true) {
  console.log(`\n🔍 TEST POUR ${listingIds.length} ANNONCES\n`);
  console.log("=".repeat(80));
  
  const results = [];
  
  for (let i = 0; i < listingIds.length; i++) {
    const id = listingIds[i];
    console.log(`\n[${i+1}/${listingIds.length}] Traitement de: ${id}`);
    
    const score = await updateListingTrustScore(id, forceRefresh);
    results.push({ id, score });
    
    // Pause pour éviter rate limiting
    if (i < listingIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log("\n📊 RÉSUMÉ DES TESTS :");
  console.log("ID | Score | Statut");
  console.log("---|-------|-------");
  results.forEach(r => {
    let status = "";
    if (r.score >= 86) status = "🟢 Excellent";
    else if (r.score >= 71) status = "🔵 Fiable";
    else if (r.score >= 51) status = "⚪ Correct";
    else if (r.score >= 31) status = "🟠 Incomplet";
    else status = "🔴 Suspect";
    console.log(`${r.id} | ${r.score} | ${status}`);
  });
  
  return results;
}

// Menu principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];
  
  console.log("\n🚀 SCRIPT DE TEST DU TRUST SCORE");
  console.log("=".repeat(80));
  
  if (command === "list") {
    await listAllListings();
  } 
  else if (command === "test" && param) {
    await testSingleListing(param, true);
  }
  else if (command === "test-multiple" && param) {
    const ids = param.split(",");
    await testMultipleListings(ids, true);
  }
  else if (command === "all") {
    const listings = await listAllListings();
    const ids = listings.map(l => l.id);
    await testMultipleListings(ids.slice(0, 5), true); // Tester max 5 pour éviter coûts
  }
  else {
    console.log(`
📖 UTILISATION :
  node scripts/test-trust-score.js list                    # Lister toutes les annonces
  node scripts/test-trust-score.js test <id>               # Tester une annonce spécifique
  node scripts/test-trust-score.js test-multiple <id1,id2> # Tester plusieurs annonces
  node scripts/test-trust-score.js all                     # Tester les 5 premières annonces

💡 EXEMPLES :
  node scripts/test-trust-score.js test cm96p9d1x0000ud0x1q2r3s4t
  node scripts/test-trust-score.js test-multiple cm96p9d1x0000ud0x1q2r3s4t,cm96p9d1x0001ud0x5u6v7w8x
  node scripts/test-trust-score.js list
    `);
  }
  
  await prisma.$disconnect();
}

// Exécuter le script
main().catch(console.error);