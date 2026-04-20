import { pipeline } from "@xenova/transformers";

// Types pour les résultats de classification
interface ClassificationResult {
  label: string;
  score: number;
}

interface ModerationResult {
  isBlocked: boolean;
  reason?: string;
  confidence?: number;
  method?: "regex" | "ai";
}

// Singleton pour le modèle (chargé une seule fois)
let toxicityClassifier: any = null;
let isModelLoading = false;
let modelLoadPromise: Promise<any> | null = null;

async function getToxicityClassifier() {
  if (toxicityClassifier) return toxicityClassifier;
  if (isModelLoading && modelLoadPromise) return modelLoadPromise;

  isModelLoading = true;
  modelLoadPromise = (async () => {
    console.log("🤖 Chargement du modèle IA de modération...");
    const startTime = Date.now();
    try {
      toxicityClassifier = await pipeline(
        "text-classification",
        "Xenova/toxic-bert",
      );
      console.log(`✅ Modèle IA chargé en ${Date.now() - startTime}ms`);
      return toxicityClassifier;
    } catch (error) {
      console.error("❌ Erreur chargement modèle IA:", error);
      throw error;
    } finally {
      isModelLoading = false;
    }
  })();
  return modelLoadPromise;
}

// Détection rapide par regex
function quickRegexCheck(text: string): {
  isBlocked: boolean;
  reason?: string;
} {
  console.log("🔍 [REGEX] Analyse du texte:", text);

  // 🔥 DÉTECTION SIMPLE POUR 8 CHIFFRES
  if (/[0-9]{8}/.test(text)) {
    console.log("✅ [REGEX] 8 chiffres consécutifs détectés!");
    return { isBlocked: true, reason: "Numéro de téléphone détecté" };
  }

  // 🔥 TOUS LES FORMATS DE NUMÉROS
  const phonePatterns = [
    /[259][0-9]{7}/,
    /[259][0-9] [0-9]{2} [0-9]{2} [0-9]{2}/,
    /[259][0-9]\.[0-9]{2}\.[0-9]{2}\.[0-9]{2}/,
    /[259][0-9]-[0-9]{2}-[0-9]{2}-[0-9]{2}/,
    /[259][0-9] [0-9]{3} [0-9]{3}/,
    /\+216[259][0-9]{7}/,
    /\+216 [259][0-9] [0-9]{3} [0-9]{3}/,
    /[259][0-9]\.[0-9]{3}\.[0-9]{3}/,
    /[259][0-9]-[0-9]{3}-[0-9]{3}/,
  ];

  for (const pattern of phonePatterns) {
    if (pattern.test(text)) {
      console.log(`✅ [REGEX] Match trouvé: ${pattern}`);
      return { isBlocked: true, reason: "Numéro de téléphone détecté" };
    }
  }

  // Emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  if (emailRegex.test(text)) {
    console.log("✅ [REGEX] Email détecté");
    return { isBlocked: true, reason: "Adresse email détectée" };
  }

  // IBAN
  const ibanRegex = /TN\d{20}/;
  if (ibanRegex.test(text)) {
    console.log("✅ [REGEX] IBAN détecté");
    return { isBlocked: true, reason: "IBAN détecté" };
  }

  // URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  if (urlRegex.test(text)) {
    console.log("✅ [REGEX] URL détectée");
    return { isBlocked: true, reason: "Lien URL détecté" };
  }

  // WhatsApp
  const whatsappRegex = /whatsapp|wa\.me|wa me/i;
  if (whatsappRegex.test(text)) {
    console.log("✅ [REGEX] WhatsApp détecté");
    return { isBlocked: true, reason: "Contact WhatsApp détecté" };
  }

  return { isBlocked: false };
}

// Détection IA
async function aiCheck(
  text: string,
): Promise<{ isBlocked: boolean; reason?: string; confidence?: number }> {
  try {
    const classifier = await getToxicityClassifier();
    const results: ClassificationResult[] = await classifier(text);

    console.log("📊 [IA] Résultats:", results);

    const blockedCategories = [
      "toxic",
      "insult",
      "threat",
      "obscene",
      "identity_hate",
    ];

    for (const result of results) {
      if (blockedCategories.includes(result.label) && result.score > 0.7) {
        return {
          isBlocked: true,
          reason: `Contenu inapproprié détecté (${result.label})`,
          confidence: result.score,
        };
      }
    }
    return { isBlocked: false };
  } catch (error) {
    console.error("Erreur IA:", error);
    return { isBlocked: false };
  }
}

// Fonction principale de modération
export async function moderateMessage(
  content: string,
): Promise<ModerationResult> {
  if (!content || content.trim().length === 0) {
    return { isBlocked: true, reason: "Message vide", method: "regex" };
  }

  // 1. Vérification regex d'abord
  const quickResult = quickRegexCheck(content);
  if (quickResult.isBlocked) {
    return {
      isBlocked: true,
      reason: quickResult.reason,
      method: "regex",
    };
  }

  // 2. Vérification IA
  try {
    const aiResult = await aiCheck(content);
    if (aiResult.isBlocked) {
      return {
        isBlocked: true,
        reason: aiResult.reason,
        confidence: aiResult.confidence,
        method: "ai",
      };
    }
  } catch (error) {
    console.error("Erreur lors de la modération IA:", error);
  }

  return { isBlocked: false, method: "regex" };
}

export async function getModelStatus() {
  return {
    loaded: toxicityClassifier !== null,
    loading: isModelLoading,
  };
}
