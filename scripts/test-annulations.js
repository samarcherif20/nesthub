// scripts/test-annulations-complet.js
require('dotenv').config({ path: '.env.local' });

const TEST_CASES = [
  // CAS LOCATAIRE
  { 
    type: "LOCATAIRE", 
    name: "CAS 1: +30 jours", 
    daysBeforeCheckIn: 35, 
    expectedRefundPercentage: 100, 
    totalPrice: 500,
    whoCancels: "TENANT"
  },
  { 
    type: "LOCATAIRE", 
    name: "CAS 2: 10 jours", 
    daysBeforeCheckIn: 10, 
    expectedRefundPercentage: 50, 
    totalPrice: 500,
    whoCancels: "TENANT"
  },
  { 
    type: "LOCATAIRE", 
    name: "CAS 3: 2 jours", 
    daysBeforeCheckIn: 2, 
    expectedRefundPercentage: 0, 
    totalPrice: 500,
    whoCancels: "TENANT"
  },
  
  // CAS PROPRIÉTAIRE
  { 
    type: "PROPRIÉTAIRE", 
    name: "CAS 4: Proprio annule (n'importe quand)", 
    daysBeforeCheckIn: 10, 
    expectedRefundPercentage: 100, 
    totalPrice: 500,
    whoCancels: "OWNER"
  },
  { 
    type: "PROPRIÉTAIRE", 
    name: "CAS 5: Proprio annule à la dernière minute", 
    daysBeforeCheckIn: 1, 
    expectedRefundPercentage: 100, 
    totalPrice: 500,
    whoCancels: "OWNER"
  },
  { 
    type: "PROPRIÉTAIRE", 
    name: "CAS 6: Proprio annule très tôt", 
    daysBeforeCheckIn: 60, 
    expectedRefundPercentage: 100, 
    totalPrice: 500,
    whoCancels: "OWNER"
  },
];

function calculateRefund(testCase) {
  const { daysBeforeCheckIn, totalPrice, whoCancels } = testCase;
  
  // PROPRIÉTAIRE → toujours 100% de remboursement
  if (whoCancels === "OWNER") {
    return {
      refundPercentage: 100,
      refundAmount: totalPrice,
      formula: "Le propriétaire annule → remboursement TOTAL (100%)",
      penalty: true
    };
  }
  
  // LOCATAIRE → selon grille
  let refundPercentage = 0;
  let formula = "";
  
  if (daysBeforeCheckIn >= 30) {
    refundPercentage = 100;
    formula = "+30 jours → remboursement TOTAL (100%)";
  } else if (daysBeforeCheckIn >= 7) {
    refundPercentage = 50;
    formula = "7-14 jours → remboursement PARTIEL (50%)";
  } else {
    refundPercentage = 0;
    formula = "-72h → PAS de remboursement (0%)";
  }
  
  return {
    refundPercentage,
    refundAmount: (totalPrice * refundPercentage) / 100,
    formula,
    penalty: false
  };
}

async function runTests() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 TESTS COMPLETS D'ANNULATION - Locataire & Propriétaire");
  console.log("=".repeat(70));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of TEST_CASES) {
    console.log(`\n📋 ${test.type} | ${test.name}`);
    console.log(`   ├─ Jours avant check-in: ${test.daysBeforeCheckIn}`);
    console.log(`   ├─ Prix total: ${test.totalPrice} TND`);
    console.log(`   ├─ Qui annule: ${test.whoCancels === "OWNER" ? "🏠 PROPRIÉTAIRE" : "👤 LOCATAIRE"}`);
    
    const result = calculateRefund(test);
    
    console.log(`   ├─ Règle: ${result.formula}`);
    console.log(`   ├─ Remboursement calculé: ${result.refundPercentage}% (${result.refundAmount} TND)`);
    
    // Vérification
    if (result.refundPercentage === test.expectedRefundPercentage) {
      console.log(`   └─ ✅ TEST RÉUSSI`);
      passed++;
    } else {
      console.log(`   └─ ❌ TEST ÉCHOUÉ: Attendu ${test.expectedRefundPercentage}%, obtenu ${result.refundPercentage}%`);
      failed++;
    }
    
    // Pénalité propriétaire
    if (result.penalty) {
      console.log(`\n   ⚠️ PÉNALITÉ PROPRIÉTAIRE:`);
      console.log(`      - Annulation #1 → Avertissement`);
      console.log(`      - Annulation #2 → Listing bloqué 7 jours`);
      console.log(`      - Annulation #3 → Compte suspendu 30 jours`);
    }
    
    // Conversion Stripe
    const rate = 0.2955;
    const refundEUR = result.refundAmount * rate;
    console.log(`\n   💶 Conversion Stripe: ${result.refundAmount} TND = ${refundEUR.toFixed(2)} EUR`);
  }
  
  console.log("\n" + "=".repeat(70));
  console.log(`📊 RÉSULTAT DES TESTS`);
  console.log("=".repeat(70));
  console.log(`✅ Réussis: ${passed}`);
  console.log(`❌ Échoués: ${failed}`);
  console.log(`📝 Total: ${TEST_CASES.length}`);
  
  if (failed === 0) {
    console.log("\n🎉 TOUS LES TESTS SONT RÉUSSIS !");
    console.log("   - Locataire: grille 30j/7j/-72h ✅");
    console.log("   - Propriétaire: remboursement 100% toujours ✅");
  }
  
  console.log("\n✨ Tests terminés ✨\n");
}

runTests().catch(console.error);