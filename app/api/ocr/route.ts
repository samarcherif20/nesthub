import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from "@clerk/nextjs/server";


// CONFIGURATION
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/heic', 'image/heif'];

// MAPPING DES MOIS (arabe → chiffres)
const arabicMonths: Record<string, string> = {
  "جانفي": "01", "فيفري": "02", "مارس": "03", "أفريل": "04",
  "ماي": "05", "جوان": "06", "جويلية": "07", "أوت": "08",
  "اوت": "08", "سبتمبر": "09", "أكتوبر": "10", "اكتوبر": "10",
  "نوفمبر": "11", "ديسمبر": "12",
  "janvier": "01", "février": "02", "mars": "03", "avril": "04",
  "mai": "05", "juin": "06", "juillet": "07", "août": "08",
  "septembre": "09", "octobre": "10", "novembre": "11", "décembre": "12"
};

// NETTOYAGE DE TEXTE
function cleanText(text: string): string {
  return text
    .replace(/[^\w\s\u0600-\u06FF\-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// EXTRACTION POUR LE RECTO
function extractRecto(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  let cinNumber = "";
  let firstName = "";
  let lastName = "";
  let dateOfBirth = "";
  
  console.log(" Analyse recto - lignes reçues:", lines);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 1. Numéro CIN (8 chiffres)
    const cinMatch = line.match(/\b(\d{8})\b/);
    if (cinMatch && !cinNumber) {
      cinNumber = cinMatch[1];
      console.log("   CIN trouvé:", cinNumber);
    }
    
    // 2. Prénom (الاسم)
    if (line.includes("الاسم")) {
      let raw = line.split("الاسم")[1]?.trim();
      if (!raw && lines[i + 1]) raw = lines[i + 1].trim();
      if (raw) {
        firstName = cleanText(raw);
        console.log("   Prénom trouvé:", firstName);
      }
    }
    
    // 3. Nom (اللقب)
    if (line.includes("اللقب")) {
      let raw = line.split("اللقب")[1]?.trim();
      if (!raw && lines[i + 1]) raw = lines[i + 1].trim();
      if (raw) {
        lastName = cleanText(raw);
        console.log("   Nom trouvé:", lastName);
      }
    }
    
    // 4. Date de naissance (تاريخ الولادة)
    if (line.includes("تاريخ الولادة")) {
      let dateStr = line.split("تاريخ الولادة")[1]?.trim();
      if (!dateStr && lines[i + 1]) dateStr = lines[i + 1].trim();
      
      if (dateStr) {
        // Format: "19 اكتوبر 1991" ou "19/10/1991"
        let parts: RegExpMatchArray | null = null;
        
        // Format avec mois en lettres
        parts = dateStr.match(/(\d{1,2})\s+([\u0600-\u06FFa-z]+)\s+(\d{4})/i);
        if (parts) {
          const day = parts[1].padStart(2, "0");
          const month = arabicMonths[parts[2].toLowerCase()] || "01";
          const year = parts[3];
          dateOfBirth = `${year}-${month}-${day}`;
        }
        
        // Format numérique JJ/MM/AAAA
        if (!dateOfBirth) {
          parts = dateStr.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
          if (parts) {
            dateOfBirth = `${parts[3]}-${parts[2]}-${parts[1]}`;
          }
        }
        
        if (dateOfBirth) console.log("  Date naissance:", dateOfBirth);
      }
    }
  }
  
  return { cinNumber, firstName, lastName, dateOfBirth };
}

// EXTRACTION POUR LE VERSO 
function extractVerso(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  let profession = "";
  
  console.log(" Analyse verso - lignes reçues:", lines);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Profession (المهنة)
    if (line.includes("المهنة")) {
      let raw = line.split("المهنة")[1]?.trim();
      if (!raw && lines[i + 1]) raw = lines[i + 1].trim();
      if (raw) {
        profession = cleanText(raw);
        console.log("   Profession trouvée:", profession);
      }
      break;
    }
    
    // "PROFESSION" en français (fallback)
    if (line.toUpperCase().includes("PROFESSION")) {
      const parts = line.split(/PROFESSION\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim()) {
        profession = cleanText(parts[1].trim());
        console.log("   Profession trouvée (français):", profession);
      }
      break;
    }
  }
    return { profession };
}

// ROUTE PRINCIPALE
export async function POST(request: NextRequest) {
  try {
    // 1. Authentification
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    // 2. Récupération du fichier
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const side = formData.get('side') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }
    
    // 3. Validation du fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: `Format non supporté. Utilisez: ${ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5MB)' }, { status: 400 });
    }
    
    console.log(` OCR ${side} - Fichier: ${file.name}, Type: ${file.type}`);
    
    // 4. Conversion en base64
    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    
    // 5. Appel Google Vision
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    
    if (!apiKey) {
      console.warn(" GOOGLE_CLOUD_API_KEY non configurée - mode démo");
      // Mode démo avec données fictives
      const demoData = side === "recto" 
        ? { cinNumber: "09797383", firstName: "احمد", lastName: "بن عيسى", dateOfBirth: "1991-10-19" }
        : { profession: "ممثل تجاري بشركة" };
      
      return NextResponse.json({
        success: true,
        extracted: demoData,
        side,
        demo: true
      });
    }
    
    // Appel réel à Google Vision
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      }
    );
    
    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error(" Google Vision error:", errorText);
      throw new Error(`Google Vision API error: ${visionResponse.status}`);
    }
    
    const data = await visionResponse.json();
    const fullText = data.responses?.[0]?.fullTextAnnotation?.text || '';
    
    console.log(` Texte brut (${side}):`, fullText.substring(0, 300));
    
    // 6. Extraction selon le côté
    let extracted;
    if (side === "recto") {
      extracted = extractRecto(fullText);
    } else {
      extracted = extractVerso(fullText);
    }
    
    console.log(` Résultat ${side}:`, extracted);
    
    // 7. Réponse
    return NextResponse.json({
      success: true,
      extracted,
      side,
      hasText: fullText.length > 0
    });
    
  } catch (error) {
    console.error(" Erreur OCR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'analyse OCR" },
      { status: 500 }
    );
  }
}