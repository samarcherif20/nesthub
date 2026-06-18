/* eslint-disable @typescript-eslint/no-require-imports */
const translate = require("google-translate-api-x");
const fs = require("fs");
const path = require("path");

const MESSAGES_DIR = path.join(__dirname, "..", "messages");

const TARGETS = [
  { code: "ar", file: "ar.json", name: "Arabe" },
  // { code: "en", file: "en.json", name: "Anglais" },
  // { code: "es", file: "es.json", name: "Espagnol" },
  // { code: "de", file: "de.json", name: "Allemand" },
  // { code: "it", file: "it.json", name: "Italien" },
];

// Récupérer TOUS les textes à traduire en une fois
function extractAllStrings(obj, path = "") {
  const strings = [];
  if (typeof obj === "object" && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      strings.push(...extractAllStrings(value, `${path}.${key}`));
    }
  } else if (typeof obj === "string") {
    strings.push({ path: path.slice(1), value: obj });
  }
  return strings;
}

// Réinjecter les textes traduits
function injectStrings(original, translations) {
  const result = { ...original };
  for (const [path, translatedValue] of Object.entries(translations)) {
    const parts = path.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = translatedValue;
  }
  return result;
}

async function translateBatch(texts, targetLang, batchSize = 50) {
  const translations = {};
  const batches = [];
  
  // Découper en lots
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize));
  }
  
  console.log(`📦 ${batches.length} lots à traduire (${batchSize} textes/lot)`);
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`\n🔄 Lot ${i + 1}/${batches.length} (${batch.length} textes)...`);
    
    // Traduire chaque texte dans le lot (avec délai réduit)
    for (const item of batch) {
      try {
        const res = await translate(item.value, { from: "fr", to: targetLang });
        translations[item.path] = res.text;
        process.stdout.write("✓");
      } catch (err) {
        console.error(`\n❌ Erreur sur: ${item.path}`, err.message);
        translations[item.path] = item.value; // Garder original en cas d'erreur
      }
      await new Promise((r) => setTimeout(r, 50)); // 50ms au lieu de 300ms
    }
  }
  
  return translations;
}

async function main() {
  console.log("🚀 Traduction massive avec Google Translate\n");
  
  // Lire le fichier source
  const sourcePath = path.join(MESSAGES_DIR, "fr.json");
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Fichier source introuvable: ${sourcePath}`);
    process.exit(1);
  }
  
  const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  
  // Extraire TOUS les textes
  console.log("📋 Extraction des textes à traduire...");
  const allStrings = extractAllStrings(source);
  console.log(`📝 ${allStrings.length} textes à traduire\n`);
  
  for (const target of TARGETS) {
    console.log(`\n🌍 Traduction vers ${target.name} (${target.code})...`);
    console.log("⏳ Démarrage...\n");
    
    const startTime = Date.now();
    
    // Traduire par lots
    const translations = await translateBatch(allStrings, target.code);
    
    // Réinjecter les traductions
    console.log("\n🔧 Réinjection des traductions...");
    const translated = injectStrings(source, translations);
    
    // Sauvegarder
    const outputPath = path.join(MESSAGES_DIR, target.file);
    fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2));
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ ${target.file} généré en ${duration} secondes !`);
  }
  
  console.log("\n🎉 Terminé !");
}

main().catch(console.error);