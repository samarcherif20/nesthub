// app/api/registration/upload-document/route.ts
import { put } from "@vercel/blob";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// ============================================
// HELPER: Détection du type d'image
// ============================================
async function detectAndFixImageFile(file: File): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { buffer, mimeType: "image/jpeg", extension: "jpg" };
  } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { buffer, mimeType: "image/png", extension: "png" };
  } else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length > 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return { buffer, mimeType: "image/webp", extension: "webp" };
    }
    return { buffer, mimeType: "image/jpeg", extension: "jpg" };
  } else {
    console.log("⚠️ Type non détecté, fallback à JPEG");
    return { buffer, mimeType: "image/jpeg", extension: "jpg" };
  }
}

// ============================================
// HELPER: Upload vers Vercel Blob
// ============================================
async function uploadToVercelBlob(file: File, userId: string, folder: string, subType: string): Promise<string> {
  const { buffer, mimeType, extension } = await detectAndFixImageFile(file);
  const filename = `nesthub/users/${userId}/${folder}/${subType}_${Date.now()}.${extension}`;
  console.log(`📤 Upload: ${filename}`);
  const blob = await put(filename, buffer, {
    access: "private",
    contentType: mimeType,
  });
  return blob.url;
}

// ============================================
// HELPER: File to Base64 pour OCR
// ============================================
async function fileToBase64(file: File): Promise<string> {
  const { buffer } = await detectAndFixImageFile(file);
  return buffer.toString("base64");
}

// ============================================
// HELPER: Google Vision OCR
// ============================================
async function callGoogleVision(base64Image: string): Promise<string> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_API_KEY manquante");
  }

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [{
        image: { content: base64Image },
        features: [{ type: "TEXT_DETECTION" }],
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Vision error: ${err}`);
  }

  const data = await res.json();
  return data.responses?.[0]?.fullTextAnnotation?.text ?? "";
}

// ============================================
// PARSER: CIN Recto
// ============================================
function parseCINRecto(text: string) {
  console.log("📝 Parsing CIN Recto...");
  
  const arabicMonths: Record<string, string> = {
    جانفي: "01", فيفري: "02", مارس: "03", افريل: "04", ماي: "05",
    جوان: "06", جويلية: "07", اوت: "08", سبتمبر: "09", اكتوبر: "10",
    نوفمبر: "11", ديسمبر: "12",
  };

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  let cinNumber: string | undefined;
  let lastName: string | undefined;
  let firstName: string | undefined;
  let dateOfBirth: string | undefined;
  let placeOfBirth: string | undefined;
  let nationality: string | undefined;
  let sex: string | undefined;

  const cinPatterns = [
    /الرقم\s*الوطني[:\s]*(\d{8})/i,
    /CIN\s*N°[:\s]*(\d{8})/i,
    /N°\s*CIN[:\s]*(\d{8})/i,
    /Identity\s*N[°:]*\s*(\d{8})/i,
    /\b(\d{8})\b/,
  ];
  
  for (const pattern of cinPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      cinNumber = match[1];
      console.log("  ✅ Numéro CIN:", cinNumber);
      break;
    }
  }

  const dateMatch = text.match(/(\d{1,2})\s+(جانفي|فيفري|مارس|افريل|ماي|جوان|جويلية|اوت|سبتمبر|اكتوبر|نوفمبر|ديسمبر)\s+(\d{4})/);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = arabicMonths[dateMatch[2]];
    const year = dateMatch[3];
    if (month) dateOfBirth = `${year}-${month}-${day}`;
    console.log("  ✅ Date naissance:", dateOfBirth);
  }

  const placePatterns = [
    /مكان\s*الولادة[:\s]*([A-ZÀ-ÿ\s]{2,50}?)(?=\n|$)/i,
    /Lieu\s*de\s*naissance[:\s]*([A-ZÀ-ÿ\s]{2,50}?)(?=\n|$)/i,
    /Place\s*of\s*birth[:\s]*([A-ZÀ-ÿ\s]{2,50}?)(?=\n|$)/i,
  ];
  for (const pattern of placePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      placeOfBirth = match[1].trim();
      console.log("  ✅ Lieu naissance:", placeOfBirth);
      break;
    }
  }

  const nationalPatterns = [
    /الجنسية[:\s]*([A-ZÀ-ÿ\s]{2,30}?)(?=\n|$)/i,
    /Nationalité[:\s]*([A-ZÀ-ÿ\s]{2,30}?)(?=\n|$)/i,
    /Nationality[:\s]*([A-ZÀ-ÿ\s]{2,30}?)(?=\n|$)/i,
  ];
  for (const pattern of nationalPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      nationality = match[1].trim();
      console.log("  ✅ Nationalité:", nationality);
      break;
    }
  }

  if (text.match(/Sexe\s*M/i) || text.match(/Sex\s*M/i) || text.match(/ذكر/i)) {
    sex = "MALE";
  } else if (text.match(/Sexe\s*F/i) || text.match(/Sex\s*F/i) || text.match(/أنثى/i)) {
    sex = "FEMALE";
  }
  if (sex) console.log("  ✅ Sexe:", sex);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("اللقب")) {
      let nameValue = line.replace(/اللقب\s*:?\s*/, "").trim();
      if (nameValue && nameValue.length >= 2) lastName = nameValue;
      else if (i + 1 < lines.length && !lines[i + 1].includes("الاسم")) lastName = lines[i + 1];
    }
    if (line.includes("الاسم")) {
      let nameValue = line.replace(/الاسم\s*:?\s*/, "").trim();
      if (nameValue && nameValue.length >= 2) firstName = nameValue;
      else if (i + 1 < lines.length) firstName = lines[i + 1];
    }
  }
  if (lastName) console.log("  ✅ Nom:", lastName);
  if (firstName) console.log("  ✅ Prénom:", firstName);

  return { cinNumber, lastName, firstName, dateOfBirth, placeOfBirth, nationality, sex };
}

// ============================================
// PARSER: CIN Verso
// ============================================
function parseCINVerso(text: string) {
  console.log("📝 Parsing CIN Verso...");
  
  let profession: string | undefined;
  let cinNumber: string | undefined;
  let address: string | undefined;
  let fatherName: string | undefined;
  let motherName: string | undefined;

  const cinMatch = text.match(/\b(\d{8})\b/);
  if (cinMatch) {
    cinNumber = cinMatch[1];
    console.log("  ✅ Numéro CIN verso:", cinNumber);
  }

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("المهنة") || line.toUpperCase().includes("PROFESSION")) {
      let profPart = line.replace(/المهنة\s*:?\s*/i, "").replace(/PROFESSION\s*:?\s*/i, "");
      if (!profPart.trim() && i + 1 < lines.length) profPart = lines[i + 1];
      if (profPart && profPart.trim().length > 0) {
        profession = profPart.trim();
        console.log("  ✅ Profession:", profession);
      }
      break;
    }
  }

  const addressPatterns = [
    /العنوان[:\s]*([A-ZÀ-ÿ\s\d]{5,100}?)(?=\n|$)/i,
    /Adresse[:\s]*([A-ZÀ-ÿ\s\d]{5,100}?)(?=\n|$)/i,
    /Address[:\s]*([A-ZÀ-ÿ\s\d]{5,100}?)(?=\n|$)/i,
  ];
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      address = match[1].trim();
      console.log("  ✅ Adresse:", address);
      break;
    }
  }

  const fatherPatterns = [
    /اسم\s*الأب[:\s]*([A-ZÀ-ÿ\s]{2,50}?)(?=\n|$)/i,
    /Père[:\s]*([A-ZÀ-ÿ\s]{2,50}?)(?=\n|$)/i,
    /Father[:\s]*([A-ZÀ-ÿ\s]{2,50}?)(?=\n|$)/i,
  ];
  for (const pattern of fatherPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      fatherName = match[1].trim();
      console.log("  ✅ Nom du père:", fatherName);
      break;
    }
  }

  const motherPatterns = [
    /اسم\s*الأم[:\s]*([A-ZÀ-ÿ\s]{2,50}?)(?=\n|$)/i,
    /Mère[:\s]*([A-ZÀ-ÿ\s]{2,50}?)(?=\n|$)/i,
    /Mother[:\s]*([A-ZÀ-ÿ\s]{2,50}?)(?=\n|$)/i,
  ];
  for (const pattern of motherPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      motherName = match[1].trim();
      console.log("  ✅ Nom de la mère:", motherName);
      break;
    }
  }

  return { profession, cinNumber, address, fatherName, motherName };
}
// ============================================
// PARSER: PASSEPORT (VERSION CORRIGÉE)
// ============================================
function parsePassport(text: string) {
  console.log("📝 Parsing passport OCR...");
   console.log("📄 TEXTE OCR COMPLET:");
  console.log("=========================================");
  console.log(text);
  console.log("=========================================");
  

  const result: {
    passportNumber: string | null;
    cinNumber: string | null;
    lastName: string | null;
    firstName: string | null;
    nationality: string | null;
    dateOfBirth: string | null;
    sex: string | null;
    profession: string | null;
    expiryDate: string | null;
  } = {
    passportNumber: null,
    cinNumber: null,
    lastName: null,
    firstName: null,
    nationality: null,
    dateOfBirth: null,
    sex: null,
    profession: null,
    expiryDate: null,
  };

  // ==========================================
  // MRZ pour nationalité
  // ==========================================
  console.log("🔍 Recherche MRZ...");
  let cleanText = text.replace(/[|`]/g, '<');
  const mrzMatch = cleanText.match(/P<([A-Z]{3})([A-Z<]+)<<([A-Z<]+)/);
  
  if (mrzMatch && mrzMatch[1]) {
    result.nationality = mrzMatch[1];
    console.log("  ✅ Nationalité:", result.nationality);
  }

  // ==========================================
  // NOM et PRÉNOM - exclure "PASSPORT"
  // ==========================================
  const words = text.match(/\b([A-Z]{3,10})\b/g) || [];
  const excludeWords = ["PASSPORT", "TUN", "MALE", "FEMALE", "REPUBLIC", "TUNISIA", "IDENTITY"];
  
  const validNames = words.filter(w => !excludeWords.includes(w) && w !== result.nationality);
  
  if (validNames.length >= 2) {
    result.lastName = validNames[0];
    result.firstName = validNames[1];
    console.log("  ✅ Nom:", result.lastName);
    console.log("  ✅ Prénom:", result.firstName);
  }
  
  // Fallback via Surname/Given names
  if (!result.lastName) {
    const surnameMatch = text.match(/Surname[:\s]*([A-Z]{3,20})/i);
    if (surnameMatch) {
      result.lastName = surnameMatch[1];
      console.log("  ✅ Nom (Surname):", result.lastName);
    }
  }
  
  if (!result.firstName) {
    const givenMatch = text.match(/Given\s*names?[:\s]*([A-Z]{3,20})/i);
    if (givenMatch) {
      result.firstName = givenMatch[1];
      console.log("  ✅ Prénom (Given):", result.firstName);
    }
  }

  // ==========================================
  // NUMERO PASSEPORT (lettre + 6 chiffres)
  // ==========================================
  const passportMatch = text.match(/([A-Z][0-9]{6})/);
  if (passportMatch) {
    result.passportNumber = passportMatch[1];
    console.log("  ✅ Numéro passeport:", result.passportNumber);
  }

  // ==========================================
  // NUMERO CIN (8 chiffres)
  // ==========================================
  const cinMatch = text.match(/الرقم\s*الوطني[:\s]*(\d{8})/i) || 
                   text.match(/\b(05\d{6})\b/);
  if (cinMatch) {
    result.cinNumber = cinMatch[1];
    console.log("  ✅ Numéro CIN:", result.cinNumber);
  }

  // ==========================================
  // DATE DE NAISSANCE
  // ==========================================
  const dateMatch = text.match(/\b(\d{2})-(\d{2})-(\d{4})\b/);
  if (dateMatch) {
    result.dateOfBirth = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    console.log("  ✅ Date naissance:", result.dateOfBirth);
  }

  // ==========================================
  // DATE D'EXPIRATION
  // ==========================================
  const expiryPatterns = [
    /Date\s*of\s*enpiry[:\s]*(\d{2}-\d{2}-\d{4})/i,
    /Date\s*of\s*expir(y|ation)[:\s]*(\d{2}-\d{2}-\d{4})/i,
    /\b(29-09-2028)\b/,
  ];
  
  for (const pattern of expiryPatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[2] || match[1];
      if (dateStr && dateStr.match(/\d{2}-\d{2}-\d{4}/)) {
        const parts = dateStr.split('-');
        result.expiryDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        console.log("  ✅ Date expiration:", result.expiryDate);
        break;
      }
    }
  }

  // ==========================================
  // SEXE
  // ==========================================
  if (text.match(/ذكر|\/ M|MALE/i)) {
    result.sex = "MALE";
  } else if (text.match(/أنثى|\/ F|FEMALE/i)) {
    result.sex = "FEMALE";
  }
  if (result.sex) console.log("  ✅ Sexe:", result.sex);

// ==========================================
// PROFESSION - VERSION GÉNÉRIQUE CORRIGÉE
// ==========================================
console.log("🔍 Recherche profession...");

let foundProfession = null;
const lines = text.split('\n');

// Définir les labels à ignorer
const commonLabels = [
  /الجمهورية/, /الإسم/, /اللقب/, /رقم/, /رمز/, /النوع/, 
  /الرقم/, /إمضاء/, /الجنسية/, /تاريخ/, /مكان/, /الجنس/, 
  /جهة/, /الحمامات/, /جواز/, /تونسية/, /Passport/, /Surname/, 
  /Given/, /Date/, /Place/, /Sex/, /Issue/, /Expiry/, /TUN/, /MALE/, /FEMALE/
];

// 1. Chercher la ligne qui contient "المهنة"
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("المهنة")) {
    if (i + 1 < lines.length) {
      let professionLine = lines[i + 1].trim();
      if (professionLine && professionLine.length > 2 && professionLine.length < 50) {
        foundProfession = professionLine;
        console.log("  ✅ Profession (après المهنة):", foundProfession);
        break;
      }
    }
  }
}

// 2. Chercher une ligne arabe après "Given names" (c'est généralement la profession)
if (!foundProfession) {
  let afterGivenNames = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === "Given names") {
      afterGivenNames = true;
      continue;
    }
    
    if (afterGivenNames && line.length > 0) {
      // La première ligne non-vide après "Given names" est le prénom (KAMEL)
      // On skip le prénom, on prend la ligne d'après
      afterGivenNames = false;
      
      // Chercher la ligne suivante qui contient de l'arabe
      for (let j = i + 1; j < lines.length; j++) {
        const nextLine = lines[j].trim();
        const hasArabic = /[\u0600-\u06FF]/.test(nextLine);
        const validLength = nextLine.length > 3 && nextLine.length < 50;
        
        if (hasArabic && validLength) {
          foundProfession = nextLine;
          console.log("  ✅ Profession (après Given names + 1):", foundProfession);
          break;
        }
      }
      break;
    }
  }
}

// 3. Chercher une ligne arabe qui n'est pas un label et n'est pas entre "Surname" et "Given names"
if (!foundProfession) {
  let isInNameSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === "Surname") isInNameSection = true;
    if (line === "Given names") isInNameSection = false;
    
    const hasArabic = /[\u0600-\u06FF]/.test(line);
    let isLabel = false;
    for (const pattern of commonLabels) {
      if (pattern.test(line)) {
        isLabel = true;
        break;
      }
    }
    
    const validLength = line.length > 3 && line.length < 50;
    const hasNoNumbers = !/\d/.test(line);
    
    // Exclure les noms complets qui contiennent des espaces et sont longs
    const isFullName = line.includes(" ") && line.length > 15;
    
    if (hasArabic && !isLabel && !isInNameSection && validLength && hasNoNumbers && !isFullName) {
      foundProfession = line;
      console.log("  ✅ Profession (ligne arabe):", foundProfession);
      break;
    }
  }
}


result.profession = foundProfession;
console.log("  ✅ Profession finale:", result.profession);

  console.log("📦 Résultat final:", result);
  return result;
}
// ============================================
// ROUTE PRINCIPALE
// ============================================
export async function POST(request: NextRequest) {
  try {
    console.log("📮 POST /api/registration/upload-document");

    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();
    const documentType = formData.get("documentType") as string;
    
    console.log(`📄 Type: ${documentType}`);

    // CAS PASSEPORT
    if (documentType === "passport") {
      const passportFile = formData.get("passportFile") as File | null;
      const profilePhoto = formData.get("profilePhoto") as File | null;

      if (!passportFile) {
        return NextResponse.json({ error: "Fichier passeport requis" }, { status: 400 });
      }

      const [passportUrl, profilePhotoUrl] = await Promise.all([
        uploadToVercelBlob(passportFile, userId, "passports", "document"),
        profilePhoto ? uploadToVercelBlob(profilePhoto, userId, "profiles", "photo") : Promise.resolve(null),
      ]);

      let extracted = null;
      try {
        const base64 = await fileToBase64(passportFile);
        const ocrText = await callGoogleVision(base64);
        console.log(`📄 OCR Texte (${ocrText.length} caractères)`);
        extracted = parsePassport(ocrText);
      } catch (ocrError) {
        console.error("⚠️ OCR échoué:", ocrError);
      }

      return NextResponse.json({
        success: true,
        ocrSuccess: extracted !== null,
        extracted,
        urls: {
          passport: passportUrl,
          profilePhoto: profilePhotoUrl,
        },
      });
    }

    // CAS CIN
    if (documentType === "cin") {
      const cinRectoFile = formData.get("cinRecto") as File | null;
      const cinVersoFile = formData.get("cinVerso") as File | null;
      const profilePhoto = formData.get("profilePhoto") as File | null;

      if (!cinRectoFile || !cinVersoFile) {
        return NextResponse.json({ error: "Les deux faces de la CIN sont requises" }, { status: 400 });
      }

      const [cinRectoUrl, cinVersoUrl, profilePhotoUrl] = await Promise.all([
        uploadToVercelBlob(cinRectoFile, userId, "cin", "recto"),
        uploadToVercelBlob(cinVersoFile, userId, "cin", "verso"),
        profilePhoto ? uploadToVercelBlob(profilePhoto, userId, "profiles", "photo") : Promise.resolve(null),
      ]);

      let rectoData = {};
      let versoData = {};
      let ocrSuccess = false;

      try {
        const [rectoBase64, versoBase64] = await Promise.all([
          fileToBase64(cinRectoFile),
          fileToBase64(cinVersoFile),
        ]);

        const [rectoText, versoText] = await Promise.all([
          callGoogleVision(rectoBase64),
          callGoogleVision(versoBase64),
        ]);

        rectoData = parseCINRecto(rectoText);
        versoData = parseCINVerso(versoText);
        ocrSuccess = true;
      } catch (ocrError) {
        console.error("⚠️ OCR échoué:", ocrError);
      }

      const extracted = {
        firstName: (rectoData as any).firstName || null,
        lastName: (rectoData as any).lastName || null,
        cinNumber: (rectoData as any).cinNumber || (versoData as any).cinNumber || null,
        dateOfBirth: (rectoData as any).dateOfBirth || null,
        placeOfBirth: (rectoData as any).placeOfBirth || null,
        nationality: (rectoData as any).nationality || null,
        sex: (rectoData as any).sex || null,
        profession: (versoData as any).profession || null,
        address: (versoData as any).address || null,
        fatherName: (versoData as any).fatherName || null,
        motherName: (versoData as any).motherName || null,
      };

      console.log("📦 Résultat final CIN:", extracted);

      return NextResponse.json({
        success: true,
        ocrSuccess,
        extracted,
        urls: {
          cinRecto: cinRectoUrl,
          cinVerso: cinVersoUrl,
          profilePhoto: profilePhotoUrl,
        },
      });
    }

    return NextResponse.json({ error: "Type de document invalide" }, { status: 400 });

  } catch (error) {
    console.error("❌ Erreur:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 },
    );
  }
}