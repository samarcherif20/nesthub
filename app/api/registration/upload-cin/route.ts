import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuth } from "@clerk/nextjs/server";

export const maxDuration = 60;

// Helper pour détecter le vrai type MIME d'un fichier
async function detectAndFixImageFile(file: File): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Détection JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { buffer, mimeType: 'image/jpeg', extension: 'jpg' };
  }
  // Détection PNG: 89 50 4E 47
  else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { buffer, mimeType: 'image/png', extension: 'png' };
  }
  // Détection WEBP
  else if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    if (buffer.length > 12 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return { buffer, mimeType: 'image/webp', extension: 'webp' };
    }
    return { buffer, mimeType: 'image/jpeg', extension: 'jpg' };
  }
  // Default to JPEG
  else {
    console.log("⚠️ Type non détecté, fallback à JPEG");
    return { buffer, mimeType: 'image/jpeg', extension: 'jpg' };
  }
}

// ─── Upload vers Vercel Blob ──────────────────────────────────────────────────
async function uploadToVercelBlob(
  file: File,
  userId: string,
  label: string,
): Promise<string> {
  // Détecter le vrai type du fichier
  const { buffer, mimeType, extension } = await detectAndFixImageFile(file);
  
  const filename = `nesthub/users/${userId}/cin/${label}_${Date.now()}.${extension}`;

  console.log(`📤 Upload Blob: ${filename} (type: ${mimeType})`);

  const blob = await put(filename, buffer, {
    access: "private",
    contentType: mimeType,
  });

  console.log(`✅ Blob URL: ${blob.url}`);
  return blob.url;
}

// ─── Convertir en base64 pour Google Vision ─────────────────────────────────
async function fileToBase64(file: File): Promise<string> {
  const { buffer } = await detectAndFixImageFile(file);
  return buffer.toString("base64");
}

// ─── Google Vision OCR ────────────────────────────────────────────────────────
async function callGoogleVision(base64Image: string): Promise<string> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ GOOGLE_CLOUD_API_KEY non configurée");
    throw new Error("GOOGLE_CLOUD_API_KEY manquante dans .env.local");
  }

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Google Vision error:", err);
    throw new Error(`Google Vision error: ${err}`);
  }

  const data = await res.json();
  return data.responses?.[0]?.fullTextAnnotation?.text ?? "";
}

// ─── Mois arabes vers numéro ─────────────────────────────────────────────────
const arabicMonths: Record<string, string> = {
  جانفي: "01",
  فيفري: "02",
  مارس: "03",
  افريل: "04",
  ماي: "05",
  جوان: "06",
  جويلية: "07",
  اوت: "08",
  سبتمبر: "09",
  اكتوبر: "10",
  نوفمبر: "11",
  ديسمبر: "12",
};

// ─── Parser RECTO CIN tunisienne (ARABE) ──────────────────────────────────────
function parseRecto(text: string): {
  cinNumber?: string;
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
} {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  console.log("📝 Parsing recto, lignes reçues:", lines.length);

  let cinNumber: string | undefined;
  let lastName: string | undefined;
  let firstName: string | undefined;
  let dateOfBirth: string | undefined;

  // 1. Numéro CIN (8 chiffres)
  const cinMatch = text.match(/\b(\d{8})\b/);
  if (cinMatch) {
    cinNumber = cinMatch[1];
    console.log("  ✅ CIN trouvé:", cinNumber);
  }

  // 2. Date de naissance (arabe)
  const dateMatch = text.match(
    /(\d{1,2})\s+(جانفي|فيفري|مارس|افريل|ماي|جوان|جويلية|اوت|سبتمبر|اكتوبر|نوفمبر|ديسمبر)\s+(\d{4})/,
  );
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = arabicMonths[dateMatch[2]];
    const year = dateMatch[3];
    if (month) {
      dateOfBirth = `${year}-${month}-${day}`;
      console.log("  ✅ Date naissance:", dateOfBirth);
    }
  }

  // 3. Chercher NOM (اللقب) et PRÉNOM (الاسم) en ARABE
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Chercher "اللقب" (Nom de famille)
    if (line.includes("اللقب")) {
      let nameValue = line.replace("اللقب", "").trim();
      if (
        nameValue &&
        nameValue.length > 0 &&
        nameValue !== "الجمهورية التونسية"
      ) {
        lastName = nameValue;
        console.log("  ✅ Nom trouvé (اللقب):", lastName);
      } else if (lines[i + 1] && !lines[i + 1].includes("الاسم")) {
        lastName = lines[i + 1];
        console.log("  ✅ Nom trouvé (ligne suivante):", lastName);
      }
    }

    // Chercher "الاسم" (Prénom)
    if (line.includes("الاسم")) {
      let nameValue = line.replace("الاسم", "").trim();
      if (
        nameValue &&
        nameValue.length > 0 &&
        nameValue !== "الجمهورية التونسية"
      ) {
        firstName = nameValue;
        console.log("  ✅ Prénom trouvé (الاسم):", firstName);
      } else if (lines[i + 1]) {
        firstName = lines[i + 1];
        console.log("  ✅ Prénom trouvé (ligne suivante):", firstName);
      }
    }
  }

  return { cinNumber, lastName, firstName, dateOfBirth };
}

// ─── Parser VERSO CIN tunisienne ──────────────────────────────────────────────
function parseVerso(text: string): { profession?: string; cinNumber?: string } {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let profession: string | undefined;
  let cinNumber: string | undefined;

  console.log("📝 Parsing verso, lignes reçues:", lines.length);

  // Chercher le numéro CIN (8 chiffres) sur le verso
  const cinMatch = text.match(/\b(\d{8})\b/);
  if (cinMatch) {
    cinNumber = cinMatch[1];
    console.log("  → Numéro CIN trouvé sur verso:", cinNumber);
  }

  // Chercher la profession en arabe "المهنة"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("المهنة")) {
      console.log("🔍 Trouvé 'المهنة' à la ligne", i);

      let profPart = line.split("المهنة")[1]?.trim();

      if (!profPart || profPart.length === 0) {
        profPart = lines[i + 1]?.trim();
        console.log("  → Profession sur ligne suivante:", profPart);
      } else {
        console.log("  → Profession sur même ligne:", profPart);
      }

      if (profPart && profPart.length > 0) {
        profession = profPart;
      }
      break;
    }

    // Chercher "PROFESSION" en français
    if (line.toUpperCase().includes("PROFESSION")) {
      const parts = line.split(/PROFESSION\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim()) {
        profession = parts[1].trim();
      } else if (lines[i + 1]) {
        profession = lines[i + 1].trim();
      }
      console.log("  → Profession (français):", profession);
      break;
    }
  }

  if (profession) {
    profession = profession.replace(/[^\w\s\u0600-\u06FF\-']/g, "").trim();
  }

  console.log("✅ Résultat verso - CIN:", cinNumber, "Profession:", profession);
  return { profession, cinNumber };
}

// ─── Nettoyage des noms ──────────────────────────────────────────────────────
function cleanName(name: string | undefined): string | null {
  if (!name) return null;
  let cleaned = name
    .replace(/[0-9]/g, "")
    .replace(/[^\p{L}\s\-']/gu, "")
    .trim()
    .substring(0, 50);

  if (cleaned.length < 2) return null;
  if (cleaned === "الجمهورية التونسية") return null;
  if (cleaned === "بطاقة التعريف الوطنية") return null;

  return cleaned;
}

// ─── Route principale ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    console.log("📮 POST /api/registration/upload-cin reçu");

    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();

    const cinRectoFile = formData.get("cinRecto") as File | null;
    const cinVersoFile = formData.get("cinVerso") as File | null;
    const profileFile = formData.get("profilePhoto") as File | null;

    if (!cinRectoFile || !cinVersoFile || !profileFile) {
      console.error("❌ Fichiers manquants");
      return NextResponse.json(
        { error: "Les 3 fichiers sont requis" },
        { status: 400 },
      );
    }

    console.log("📤 Début uploads Vercel Blob...");

    // ── Étape 1 : Upload Vercel Blob (en parallèle) ────────────────────────
    const [cinRectoUrl, cinVersoUrl, profilePhotoUrl] = await Promise.all([
      uploadToVercelBlob(cinRectoFile, userId, "cin_recto"),
      uploadToVercelBlob(cinVersoFile, userId, "cin_verso"),
      uploadToVercelBlob(profileFile, userId, "profile"),
    ]);

    console.log("✅ Tous les fichiers uploadés sur Blob");

    // ── Étape 2 : Google Vision OCR ─────────────────────────────────────────
    console.log("🔍 Début OCR Google Vision...");

    let rectoText = "";
    let versoText = "";
    let ocrSuccess = false;

    try {
      const [rectoBase64, versoBase64] = await Promise.all([
        fileToBase64(cinRectoFile),
        fileToBase64(cinVersoFile),
      ]);

      [rectoText, versoText] = await Promise.all([
        callGoogleVision(rectoBase64),
        callGoogleVision(versoBase64),
      ]);

      console.log(`📄 Recto OCR: ${rectoText.length} caractères`);
      console.log(`📄 Verso OCR: ${versoText.length} caractères`);
      
      if (rectoText.length > 10) {
        console.log("📄 Extrait Recto:", rectoText.substring(0, 300));
      }
      if (versoText.length > 10) {
        console.log("📄 Extrait Verso:", versoText.substring(0, 300));
      }

      ocrSuccess = rectoText.length > 10;
    } catch (ocrError) {
      console.error("⚠️ OCR échoué (non bloquant):", ocrError);
      ocrSuccess = false;
    }

    // ── Étape 3 : Parser les données ────────────────────────────────────────
    const rectoData = parseRecto(rectoText);
    const versoData = parseVerso(versoText);

    const finalCinNumber = rectoData.cinNumber || versoData.cinNumber;

    const extracted = {
      firstName: cleanName(rectoData.firstName),
      lastName: cleanName(rectoData.lastName),
      dateOfBirth: rectoData.dateOfBirth ?? null,
      cinNumber: finalCinNumber ? (finalCinNumber.match(/\d{8}/)?.[0] ?? null) : null,
      profession: versoData.profession ?? null,
    };

    console.log("✅ Extraction terminée:", extracted);

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
  } catch (error) {
    console.error("❌ Erreur upload-cin:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 },
    );
  }
}