import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuth } from "@clerk/nextjs/server";

export const maxDuration = 60;

// Helper pour détecter le vrai type MIME d'un fichier
async function detectAndFixImageFile(
  file: File,
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { buffer, mimeType: "image/jpeg", extension: "jpg" };
  } else if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { buffer, mimeType: "image/png", extension: "png" };
  } else if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46
  ) {
    if (
      buffer.length > 12 &&
      buffer[8] === 0x57 &&
      buffer[9] === 0x45 &&
      buffer[10] === 0x42 &&
      buffer[11] === 0x50
    ) {
      return { buffer, mimeType: "image/webp", extension: "webp" };
    }
    return { buffer, mimeType: "image/jpeg", extension: "jpg" };
  } else {
    console.log(" Type non détecté, fallback à JPEG");
    return { buffer, mimeType: "image/jpeg", extension: "jpg" };
  }
}

// ─── Upload vers Vercel Blob ──────────────────────────────────────────────────
async function uploadToVercelBlob(
  file: File,
  userId: string,
  label: string,
): Promise<string> {
  const { buffer, mimeType, extension } = await detectAndFixImageFile(file);
  const filename = `nesthub/users/${userId}/cin/${label}_${Date.now()}.${extension}`;
  console.log(` Upload Blob: ${filename} (type: ${mimeType})`);
  const blob = await put(filename, buffer, {
    access: "private",
    contentType: mimeType,
  });
  console.log(` Blob URL: ${blob.url}`);
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
    console.warn(" GOOGLE_CLOUD_API_KEY non configurée");
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
    console.error(" Google Vision error:", err);
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

// ─── Parser RECTO CIN tunisienne (AVEC SUPPORT NOMS COMPOSÉS) ─────────────────
function parseRecto(text: string): {
  cinNumber?: string;
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
} {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  console.log(" Parsing recto, lignes reçues:", lines.length);

  let cinNumber: string | undefined;
  let lastName: string | undefined;
  let firstName: string | undefined;
  let dateOfBirth: string | undefined;

  // 1. Numéro CIN (8 chiffres)
  const allNumbers = text.match(/\b(\d{8})\b/g);
  if (allNumbers && allNumbers.length > 0) {
    cinNumber = allNumbers[0];
    console.log("   CIN trouvé:", cinNumber);
  }

  // 2. Date de naissance
  const dateMatch = text.match(
    /(\d{1,2})\s+(جانفي|فيفري|مارس|افريل|ماي|جوان|جويلية|اوت|سبتمبر|اكتوبر|نوفمبر|ديسمبر)\s+(\d{4})/,
  );
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = arabicMonths[dateMatch[2]];
    const year = dateMatch[3];
    if (month) {
      dateOfBirth = `${year}-${month}-${day}`;
      console.log("   Date naissance:", dateOfBirth);
    }
  }

  // 3. Ignorer les lignes d'en-tête
  const ignorePatterns = [
    /الجمهورية التونسية/,
    /بطاقة التعريف الوطنية/,
    /^\d+$/,
    /تاريخ الولادة/,
    /مكانها/,
    /بنت/,
    /ابن/,
  ];

  const isIgnoredLine = (line: string) => {
    return ignorePatterns.some((p) => p.test(line));
  };

  // 4. Chercher NOM (اللقب) et PRÉNOM (الاسم) avec support noms composés
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Chercher "اللقب" (Nom de famille)
    if (line.includes("اللقب")) {
      let nameValue = line.replace(/اللقب\s*:?\s*/, "").trim();
      if (nameValue && nameValue.length >= 2 && !isIgnoredLine(nameValue)) {
        lastName = nameValue;
        console.log("   Nom trouvé (اللقب):", lastName);
      } else if (
        i + 1 < lines.length &&
        !isIgnoredLine(lines[i + 1]) &&
        !lines[i + 1].includes("الاسم")
      ) {
        lastName = lines[i + 1];
        console.log("   Nom trouvé (ligne suivante):", lastName);
      }
    }

    // Chercher "الاسم" (Prénom)
    if (line.includes("الاسم")) {
      let nameValue = line.replace(/الاسم\s*:?\s*/, "").trim();
      if (nameValue && nameValue.length >= 2 && !isIgnoredLine(nameValue)) {
        firstName = nameValue;
        console.log("   Prénom trouvé (الاسم):", firstName);
      } else if (i + 1 < lines.length && !isIgnoredLine(lines[i + 1])) {
        firstName = lines[i + 1];
        console.log("   Prénom trouvé (ligne suivante):", firstName);
      }
    }
  }

  // 5. Extraction entre "اللقب" et "الاسم" (pour les noms composés)
  const betweenLa9abAndIsm = text.match(/اللقب\s*:?\s*([\s\S]+?)الاسم/);
  if (betweenLa9abAndIsm && betweenLa9abAndIsm[1] && !lastName) {
    let namePart = betweenLa9abAndIsm[1].trim();
    const words = namePart.split(/\s+/);
    if (words.length > 0) {
      lastName = words.slice(0, Math.min(3, words.length)).join(" ");
      console.log("   Nom composé trouvé (entre اللقب والاسم):", lastName);
    }
  }

  // 6. Nettoyage final: garder les espaces pour les noms composés
  if (lastName) {
    lastName = lastName
      .replace(/[0-9]/g, "")
      .replace(/[^\p{L}\s\-']/gu, "")
      .trim();
    if (lastName.length > 100) lastName = lastName.substring(0, 100);
  }

  if (firstName) {
    firstName = firstName
      .replace(/[0-9]/g, "")
      .replace(/[^\p{L}\s\-']/gu, "")
      .trim();
    if (firstName.length > 100) firstName = firstName.substring(0, 100);
  }

  return { cinNumber, lastName, firstName, dateOfBirth };
}

// ─── Parser VERSO CIN tunisienne (GÉNÉRALISÉ) ─────────────────────────────────
function parseVerso(text: string): { profession?: string; cinNumber?: string } {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let profession: string | undefined;
  let cinNumber: string | undefined;

  console.log(" Parsing verso, lignes reçues:", lines.length);

  // 1. Numéro CIN (8 chiffres)
  const cinMatch = text.match(/\b(\d{8})\b/);
  if (cinMatch && !cinNumber) {
    cinNumber = cinMatch[1];
    console.log("  → Numéro CIN trouvé sur verso:", cinNumber);
  }

  // 2. Chercher la profession (patterns multiples)
  const professionPatterns = [
    /المهنة\s*:?\s*([^\n]+)/i,
    /PROFESSION\s*:?\s*([^\n]+)/i,
    /صنعة\s*:?\s*([^\n]+)/i,
    /مهنته\s*:?\s*([^\n]+)/i,
  ];

  for (const pattern of professionPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 0) {
      profession = match[1].trim();
      console.log("   Profession trouvée (pattern):", profession);
      break;
    }
  }

  // 3. Si pas trouvé, chercher dans les lignes
  if (!profession) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (
        line.includes("المهنة") ||
        line.toUpperCase().includes("PROFESSION")
      ) {
        console.log(" Trouvé profession à la ligne", i);

        let profPart = line
          .replace(/المهنة\s*:?\s*/i, "")
          .replace(/PROFESSION\s*:?\s*/i, "");

        if (!profPart.trim() && i + 1 < lines.length) {
          profPart = lines[i + 1];
          console.log("  → Profession sur ligne suivante:", profPart);
        } else if (profPart.trim()) {
          console.log("  → Profession sur même ligne:", profPart);
        }

        if (profPart && profPart.trim().length > 0) {
          profession = profPart.trim();
          break;
        }
      }
    }
  }

  // Nettoyer la profession
  if (profession) {
    profession = profession.replace(/[^\w\s\u0600-\u06FF\-']/g, "").trim();
    if (profession.length > 100) profession = profession.substring(0, 100);
  }

  console.log(" Résultat verso - CIN:", cinNumber, "Profession:", profession);
  return { profession, cinNumber };
}

// ─── Nettoyage des noms ──────────────────────────────────────────────────────
function cleanName(name: string | undefined): string | null {
  if (!name) return null;
  let cleaned = name
    .replace(/[0-9]/g, "")
    .replace(/[^\p{L}\s\-']/gu, "")
    .trim()
    .substring(0, 100); // Augmenté à 100 pour les noms composés

  if (cleaned.length < 2) return null;

  const ignoreValues = [
    "الجمهورية التونسية",
    "بطاقة التعريف الوطنية",
    "الل",
    "الاسم",
    "اللقب",
  ];
  if (ignoreValues.includes(cleaned)) return null;

  return cleaned;
}

// ─── Route principale ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    console.log(" POST /api/registration/upload-cin reçu");

    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formData = await request.formData();

    const cinRectoFile = formData.get("cinRecto") as File | null;
    const cinVersoFile = formData.get("cinVerso") as File | null;
    const profileFile = formData.get("profilePhoto") as File | null;

    if (!cinRectoFile || !cinVersoFile || !profileFile) {
      console.error(" Fichiers manquants");
      return NextResponse.json(
        { error: "Les 3 fichiers sont requis" },
        { status: 400 },
      );
    }

    console.log(" Début uploads Vercel Blob...");

    const [cinRectoUrl, cinVersoUrl, profilePhotoUrl] = await Promise.all([
      uploadToVercelBlob(cinRectoFile, userId, "cin_recto"),
      uploadToVercelBlob(cinVersoFile, userId, "cin_verso"),
      uploadToVercelBlob(profileFile, userId, "profile"),
    ]);

    console.log(" Tous les fichiers uploadés sur Blob");

    console.log(" Début OCR Google Vision...");

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

      console.log(` Recto OCR: ${rectoText.length} caractères`);
      console.log(` Verso OCR: ${versoText.length} caractères`);

      if (rectoText.length > 10) {
        console.log(" Extrait Recto:", rectoText.substring(0, 500));
      }
      if (versoText.length > 10) {
        console.log(" Extrait Verso:", versoText.substring(0, 500));
      }

      ocrSuccess = rectoText.length > 10;
    } catch (ocrError) {
      console.error(" OCR échoué (non bloquant):", ocrError);
      ocrSuccess = false;
    }

    const rectoData = parseRecto(rectoText);
    const versoData = parseVerso(versoText);

    const finalCinNumber = rectoData.cinNumber || versoData.cinNumber;

    const extracted = {
      firstName: cleanName(rectoData.firstName),
      lastName: cleanName(rectoData.lastName),
      dateOfBirth: rectoData.dateOfBirth ?? null,
      cinNumber: finalCinNumber
        ? (finalCinNumber.match(/\d{8}/)?.[0] ?? null)
        : null,
      profession: versoData.profession ?? null,
    };

    console.log(" Extraction terminée:", extracted);

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
    console.error(" Erreur upload-cin:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur interne" },
      { status: 500 },
    );
  }
}
