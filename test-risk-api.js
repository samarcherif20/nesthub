// test-risk-api.js
const BASE_URL = "http://localhost:3000";

// 🔑 REMPLACE AVEC TON VRAI ID UTILISATEUR
const TEST_USER_ID = "6259d267-d266-4b46-8a2b-28b9a25bc466";

async function testAPI() {
  console.log("🧪 TEST DES APIS RISK SCORING\n");
  console.log("═".repeat(60));
  
  // 1. D'abord, vérifier que l'utilisateur existe
  console.log("\n📌 TEST 0: Vérifier que l'utilisateur existe");
  try {
    const res0 = await fetch(`${BASE_URL}/api/users/me`);
    const data0 = await res0.json();
    console.log("   Utilisateur connecté:", data0.user?.email || "Non connecté");
  } catch (err) {
    console.log("   ⚠️ Assure-toi d'être connecté avec Clerk");
  }

  // 2. Récupérer le score de l'utilisateur
  console.log("\n📌 TEST 1: GET /api/users/6259d267-d266-4b46-8a2b-28b9a25bc466/trust-score");
  try {
    const res1 = await fetch(`${BASE_URL}/api/users/${TEST_USER_ID}/trust-score`);
    const data1 = await res1.json();
    console.log("   Statut:", res1.status);
    console.log("   Réponse:", JSON.stringify(data1, null, 2));
  } catch (err) {
    console.log("   ❌ Erreur:", err.message);
  }

  // 3. Récupérer son propre score (si connecté)
  console.log("\n📌 TEST 2: GET /api/users/me/trust-score");
  try {
    const res2 = await fetch(`${BASE_URL}/api/users/me/trust-score`);
    const data2 = await res2.json();
    console.log("   Statut:", res2.status);
    console.log("   Réponse:", JSON.stringify(data2, null, 2));
  } catch (err) {
    console.log("   ❌ Erreur:", err.message);
  }

  // 4. Forcer le recalcul (admin seulement)
  console.log("\n📌 TEST 3: POST /api/admin/risk-score/recalculate");
  console.log("   ⚠️ Cette API nécessite le rôle ADMIN");
  try {
    const res3 = await fetch(`${BASE_URL}/api/admin/risk-score/recalculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: TEST_USER_ID })
    });
    const data3 = await res3.json();
    console.log("   Statut:", res3.status);
    console.log("   Réponse:", JSON.stringify(data3, null, 2));
  } catch (err) {
    console.log("   ❌ Erreur:", err.message);
  }

  console.log("\n" + "═".repeat(60));
  console.log("✅ Tests terminés");
}

testAPI();