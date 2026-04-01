// scripts/test-vision.js
const { ImageAnnotatorClient } = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

// Chemin vers ton image
const imagePath = path.join(__dirname, '../ocr-service/cin-front.png');

// Chemin vers le fichier credentials (à la racine)
const credentialsPath = path.join(__dirname, '../google-credentials.json');

// Vérifier que l'image existe
if (!fs.existsSync(imagePath)) {
  console.error('❌ Image non trouvée:', imagePath);
  console.log('Assure-toi que ocr-service/cin-front.png existe');
  process.exit(1);
}

// Vérifier que le fichier credentials existe
if (!fs.existsSync(credentialsPath)) {
  console.error('❌ Fichier credentials non trouvé:', credentialsPath);
  console.log('\n📌 Exécute cette commande:');
  console.log('copy C:\\Users\\Samar\\Downloads\\nesthub-ocr-dd14afe26cb9.json google-credentials.json');
  process.exit(1);
}

console.log('✅ Fichier credentials trouvé');
console.log('📸 Image:', imagePath);
console.log('📏 Taille:', fs.statSync(imagePath).size, 'bytes\n');

// Initialiser le client
const client = new ImageAnnotatorClient({
  keyFilename: credentialsPath
});

async function testGoogleVision() {
  try {
    console.log('🔍 Appel à Google Vision API...\n');
    
    const imageBuffer = fs.readFileSync(imagePath);
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (detections && detections.length > 0) {
      const fullText = detections[0].description;
      console.log('📝 TEXTE DÉTECTÉ:');
      console.log('='.repeat(60));
      console.log(fullText);
      console.log('='.repeat(60));
      
      // Extraire le numéro CIN (8 chiffres)
      const cinMatch = fullText.match(/\b\d{8}\b/);
      if (cinMatch) {
        console.log('\n✅ Numéro CIN:', cinMatch[0]);
      } else {
        const cinMatch7 = fullText.match(/\b\d{7}\b/);
        if (cinMatch7) {
          console.log('\n✅ Numéro CIN (7 chiffres):', '0' + cinMatch7[0]);
        } else {
          console.log('\n⚠️ Aucun numéro CIN trouvé');
        }
      }
      
      // Extraire la date
      const dateMatch = fullText.match(/(\d{1,2})\s*(ماي|جانفي|فيفري|مارس|أفريل|جوان|جويلية|أوت|سبتمبر|أكتوبر|نوفمبر|ديسمبر)\s*(\d{4})/i);
      if (dateMatch) {
        console.log('✅ Date de naissance:', dateMatch[0]);
      }
      
      // Extraire le nom (اللقب)
      const lastNameMatch = fullText.match(/(?:اللقب|لقب)[:\s]*([\u0600-\u06FF]{2,15})/);
      if (lastNameMatch) {
        console.log('✅ Nom (اللقب):', lastNameMatch[1]);
      }
      
      // Extraire le prénom (الاسم)
      const firstNameMatch = fullText.match(/(?:الاسم|اسم)[:\s]*([\u0600-\u06FF]{2,15})/);
      if (firstNameMatch) {
        console.log('✅ Prénom (الاسم):', firstNameMatch[1]);
      }
      
      // Compter le nombre de mots
      const words = fullText.split(/\s+/);
      console.log(`\n📊 Total mots détectés: ${words.length}`);
      
    } else {
      console.log('⚠️ Aucun texte détecté');
    }
    
  } catch (error) {
    console.error('❌ Erreur Google Vision:', error.message);
    if (error.message.includes('Permission denied') || error.message.includes('not enabled')) {
      console.log('\n🔧 Active l\'API Vision:');
      console.log('https://console.cloud.google.com/apis/library/vision.googleapis.com');
    }
    if (error.message.includes('invalid_grant') || error.message.includes('JWT')) {
      console.log('\n🔧 Problème avec le fichier credentials');
      console.log('1. Va sur https://console.cloud.google.com/apis/credentials');
      console.log('2. Trouve ton service account');
      console.log('3. Crée une nouvelle clé JSON');
      console.log('4. Remplace google-credentials.json');
    }
  }
}

testGoogleVision();