// lib/ai-init.ts
import { pipeline } from '@xenova/transformers';

let modelLoaded = false;

export async function initAIModel() {
  if (modelLoaded) return;
  
  console.log("🤖 [INIT] Démarrage du chargement du modèle IA...");
  console.log("⏳ Cela peut prendre 10-15 secondes au premier chargement");
  
  try {
    const startTime = Date.now();
    const classifier = await pipeline('text-classification', 'Xenova/toxic-bert');
    const duration = Date.now() - startTime;
    console.log(`✅ [INIT] Modèle IA chargé avec succès en ${duration}ms`);
    modelLoaded = true;
    return classifier;
  } catch (error) {
    console.error("❌ [INIT] Erreur chargement modèle IA:", error);
    throw error;
  }
}

// Charge le modèle au démarrage du serveur
if (typeof window === 'undefined') {
  // Exécute seulement côté serveur
  initAIModel().catch(console.error);
}