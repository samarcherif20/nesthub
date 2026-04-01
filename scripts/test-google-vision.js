// scripts/test-google-vision.js
const vision = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

// Initialiser le client
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, '../google-credentials.json')
});

async function testOCR() {
  try {
    // Chemin de l'image de test
    const imagePath = path.join(__dirname, '../ocr-service/cin-front.png');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ Image non trouvée:', imagePath);
      console.log('Place une image de CIN dans public/test-cin.jpg');
      return;
    }
    
    console.log('📸 Analyse de:', imagePath);
    
    // Lire l'image
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Envoyer à Google Vision
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (detections && detections.length > 0) {
      const fullText = detections[0].description;
      console.log('\n📝 Texte complet détecté:');
      console.log('─'.repeat(50));
      console.log(fullText);
      console.log('─'.repeat(50));
      
      // Extraire le numéro CIN (8 chiffres)
      const cinMatch = fullText.match(/\b\d{8}\b/);
      if (cinMatch) {
        console.log('\n✅ Numéro CIN détecté:', cinMatch[0]);
      } else {
        console.log('\n⚠️ Aucun numéro CIN trouvé');
      }
      
      // Extraire la date (format JJ/MM/AAAA ou JJ Mois AAAA)
      const dateMatch = fullText.match(/\d{1,2}\s*(?:[/-]|\s+)?\d{1,2}\s*(?:[/-]|\s+)?\d{4}/);
      if (dateMatch) {
        console.log('✅ Date détectée:', dateMatch[0]);
      }
      
      // Extraire les mots clés
      const words = fullText.split(/\s+/);
      console.log('\n🔍 Premier aperçu (20 mots):');
      console.log(words.slice(0, 20).join(' '));
      
    } else {
      console.log('⚠️ Aucun texte détecté');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.message.includes('Could not load the default credentials')) {
      console.log('\n🔧 Configuration requise:');
      console.log('1. Va sur https://console.cloud.google.com');
      console.log('2. Crée un projet et active Vision API');
      console.log('3. Crée une clé de service (JSON)');
      console.log('4. Place le fichier JSON dans google-credentials.json');
      console.log('5. Ajoute GOOGLE_APPLICATION_CREDENTIALS');
    }
  }
}

testOCR();