// scripts/test-api-annulations.js
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ⚠️ À MODIFIER AVEC TES VRAIS IDs
const LISTING_ID = "cmojv832w0000upgc4140vu20";
const TENANT_ID = "e6dd5c76-8d45-4809-840b-ecab8a43e631";
const OWNER_ID = "6259d267-d266-4b46-8a2b-28b9a25bc466";

async function createTestBooking(checkInDays, totalPrice, createdHoursAgo = 0) {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + checkInDays);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);
  
  const createdAt = new Date();
  createdAt.setHours(createdAt.getHours() - createdHoursAgo);

  const booking = await prisma.booking.create({
    data: {
      reference: `API-TEST-${Date.now()}`,
      listingId: LISTING_ID,
      tenantId: TENANT_ID,
      ownerId: OWNER_ID,
      checkIn: checkIn,
      checkOut: checkOut,
      guests: 2,
      totalNights: 3,
      pricePerNight: totalPrice / 3,
      totalPrice: totalPrice,
      cleaningFee: 0,
      serviceFee: 0,
      totalWithFees: totalPrice,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      createdAt: createdAt,
      stripePaymentIntentId: `pi_test_${Date.now()}`, // Simulé pour test
    },
  });
  
  console.log(`📝 Réservation créée: ${booking.id} - ${booking.reference}`);
  return booking;
}

async function callCancelAPI(bookingId, userId, isOwner = false) {
  // Simuler l'appel API (remplace par ton vrai appel)
  console.log(`📡 Appel API: POST /api/bookings/${bookingId}/cancel`);
  console.log(`   Body: { reason: "Test API" }`);
  
  // Ici tu devrais faire un vrai fetch si ton serveur tourne
  // const response = await fetch(`http://localhost:3000/api/bookings/${bookingId}/cancel`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ reason: "Test automatique" }),
  // });
  // return await response.json();
  
  // Pour l'instant, simulation
  return { success: true, message: "Simulation" };
}

async function checkBookingStatus(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      refundAmount: true,
      refundPercentage: true,
      cancellationReason: true,
    },
  });
  return booking;
}

async function testCase1_30Jours() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 CAS 1: Locataire annule +30 jours → 100%");
  console.log("=".repeat(60));
  
  const booking = await createTestBooking(35, 500);
  console.log(`✅ Réservation créée (check-in dans 35 jours)`);
  
  // Appel API
  console.log(`\n📡 Annulation en cours...`);
  const result = await callCancelAPI(booking.id, TENANT_ID);
  
  // Vérification
  const updated = await checkBookingStatus(booking.id);
  console.log(`\n📊 Résultat:`);
  console.log(`   - Status: ${updated.status}`);
  console.log(`   - Refund Amount: ${updated.refundAmount} TND`);
  console.log(`   - Refund Percentage: ${updated.refundPercentage}%`);
  
  const success = updated.status === "CANCELLED" && updated.refundAmount === 500;
  console.log(`\n${success ? "✅ TEST RÉUSSI" : "❌ TEST ÉCHOUÉ"}`);
  
  return { booking, success };
}

async function testCase2_10Jours() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 CAS 2: Locataire annule 10 jours → 50%");
  console.log("=".repeat(60));
  
  const booking = await createTestBooking(10, 500);
  console.log(`✅ Réservation créée (check-in dans 10 jours)`);
  
  const result = await callCancelAPI(booking.id, TENANT_ID);
  
  const updated = await checkBookingStatus(booking.id);
  console.log(`\n📊 Résultat:`);
  console.log(`   - Status: ${updated.status}`);
  console.log(`   - Refund Amount: ${updated.refundAmount} TND`);
  console.log(`   - Refund Percentage: ${updated.refundPercentage}%`);
  
  const success = updated.status === "CANCELLED" && updated.refundAmount === 250;
  console.log(`\n${success ? "✅ TEST RÉUSSI" : "❌ TEST ÉCHOUÉ"}`);
  
  return { booking, success };
}

async function testCase3_2Jours() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 CAS 3: Locataire annule 2 jours → 0%");
  console.log("=".repeat(60));
  
  const booking = await createTestBooking(2, 500);
  console.log(`✅ Réservation créée (check-in dans 2 jours)`);
  
  const result = await callCancelAPI(booking.id, TENANT_ID);
  
  const updated = await checkBookingStatus(booking.id);
  console.log(`\n📊 Résultat:`);
  console.log(`   - Status: ${updated.status}`);
  console.log(`   - Refund Amount: ${updated.refundAmount} TND`);
  console.log(`   - Refund Percentage: ${updated.refundPercentage}%`);
  
  const success = updated.status === "CANCELLED" && updated.refundAmount === 0;
  console.log(`\n${success ? "✅ TEST RÉUSSI" : "❌ TEST ÉCHOUÉ"}`);
  
  return { booking, success };
}

async function testCase4_Retractation() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 CAS 4: Rétractation 24h → 100%");
  console.log("=".repeat(60));
  
  const booking = await createTestBooking(3, 500, 2);
  console.log(`✅ Réservation créée (créée il y a 2h, check-in dans 3 jours)`);
  
  const result = await callCancelAPI(booking.id, TENANT_ID);
  
  const updated = await checkBookingStatus(booking.id);
  console.log(`\n📊 Résultat:`);
  console.log(`   - Status: ${updated.status}`);
  console.log(`   - Refund Amount: ${updated.refundAmount} TND`);
  console.log(`   - Refund Percentage: ${updated.refundPercentage}%`);
  
  const success = updated.status === "CANCELLED" && updated.refundAmount === 500;
  console.log(`\n${success ? "✅ TEST RÉUSSI" : "❌ TEST ÉCHOUÉ"}`);
  
  return { booking, success };
}

async function testCase5_OwnerFirstCancel() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 CAS 5: Propriétaire annule (1ère fois) → Avertissement");
  console.log("=".repeat(60));
  
  // Reset penalty
  await prisma.userStats.upsert({
    where: { userId: OWNER_ID },
    update: { cancellationCount: 0 },
    create: { userId: OWNER_ID, cancellationCount: 0 },
  });
  
  const booking = await createTestBooking(10, 500);
  console.log(`✅ Réservation créée - Pénalité actuelle: 0`);
  
  const result = await callCancelAPI(booking.id, OWNER_ID, true);
  
  const stats = await prisma.userStats.findUnique({ where: { userId: OWNER_ID } });
  console.log(`\n📊 Résultat:`);
  console.log(`   - Pénalité après annulation: ${stats?.cancellationCount}`);
  
  const success = stats?.cancellationCount === 1;
  console.log(`\n${success ? "✅ TEST RÉUSSI (Avertissement)" : "❌ TEST ÉCHOUÉ"}`);
  
  return { booking, success };
}

async function cleanup(bookings) {
  console.log("\n" + "=".repeat(60));
  console.log("🧹 Nettoyage des données de test");
  console.log("=".repeat(60));
  
  for (const b of bookings) {
    if (b?.id) {
      await prisma.booking.delete({ where: { id: b.id } }).catch(() => {});
      console.log(`🗑️ Supprimé: ${b.id}`);
    }
  }
}

async function runAllTests() {
  console.log("\n🌟🚀 TESTS COMPLETS DE L'API D'ANNULATION 🌟\n");
  
  const testResults = [];
  const createdBookings = [];
  
  // Exécuter les tests
  const test1 = await testCase1_30Jours();
  createdBookings.push(test1.booking);
  testResults.push(test1);
  
  const test2 = await testCase2_10Jours();
  createdBookings.push(test2.booking);
  testResults.push(test2);
  
  const test3 = await testCase3_2Jours();
  createdBookings.push(test3.booking);
  testResults.push(test3);
  
  const test4 = await testCase4_Retractation();
  createdBookings.push(test4.booking);
  testResults.push(test4);
  
  const test5 = await testCase5_OwnerFirstCancel();
  createdBookings.push(test5.booking);
  testResults.push(test5);
  
  // Résumé
  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ DES TESTS");
  console.log("=".repeat(60));
  
  const passed = testResults.filter(r => r.success).length;
  console.log(`✅ Réussis: ${passed}/${testResults.length}`);
  
  // Nettoyage (optionnel)
  // await cleanup(createdBookings);
  
  console.log("\n✨ Tests terminés ✨\n");
}

runAllTests().catch(console.error);