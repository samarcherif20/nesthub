import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuth } from "@clerk/nextjs/server"; // ← AJOUTEZ CETTE LIGNE

export const maxDuration = 60;

// ─── Upload vers Vercel Blob ──────────────────────────────────────────────────
async function uploadToVercelBlob(
  file: File,
  userId: string,
  label: string,
): Promise<string> {
  const extension = file.type.split("/")[1] || "jpg";
  const filename = `nesthub/users/${userId}/cin/${label}_${Date.now()}.${extension}`;

  console.log(`📤 Upload Blob: ${filename}`);

  const blob = await put(filename, file, {
    access: "private",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  console.log(`✅ Blob URL: ${blob.url}`);
  return blob.url;
}

// ─── Convertir File en base64 pour Google Vision ─────────────────────────────
async function fileToBase64(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes).toString("base64");
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
            features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
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

// ─── Parser RECTO CIN tunisienne (VERSION COMPLÈTE) ──────────────────────────────
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

  console.log("📝 Parsing recto, lignes reçues:", lines);

  // ✅ Déclaration UNIQUE des variables
  let cinNumber: string | undefined;
  let lastName: string | undefined;
  let firstName: string | undefined;
  let dateOfBirth: string | undefined;

  // 1. Numéro CIN
  const cinMatch = text.match(/\b(\d{8})\b/);
  if (cinMatch) {
    cinNumber = cinMatch[1];
    console.log("  ✅ CIN trouvé sur recto:", cinNumber);
  }

  // 2. Date de naissance (PAS de let devant !)
  const dateMatch = text.match(/\b(\d{2})[\/\.\-](\d{2})[\/\.\-](\d{4})\b/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    dateOfBirth = `${year}-${month}-${day}`;
    console.log("  → Date trouvée:", dateOfBirth);
  }

  // 3. Chercher les noms
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();

    if (lineUpper.includes("NOM")) {
      const nomMatch = line.match(
        /NOM\s*:?\s*([A-ZÀÂÇÉÈÊËÎÏÔÙÛÜ][A-ZÀÂÇÉÈÊËÎÏÔÙÛÜ\s\-']+)/i,
      );
      if (nomMatch) {
        lastName = nomMatch[1].trim();
        console.log("  → Nom trouvé (pattern):", lastName);
      } else if (
        lines[i + 1] &&
        !lines[i + 1].toUpperCase().includes("PRENOM")
      ) {
        lastName = lines[i + 1].replace(/[^A-ZÀÂÇÉÈÊËÎÏÔÙÛÜ\s\-']/g, "").trim();
        console.log("  → Nom trouvé (ligne suivante):", lastName);
      }
    }

    if (lineUpper.includes("PRENOM")) {
      const prenomMatch = line.match(
        /PRENOM\s*:?\s*([A-ZÀÂÇÉÈÊËÎÏÔÙÛÜ][A-ZÀÂÇÉÈÊËÎÏÔÙÛÜ\s\-']+)/i,
      );
      if (prenomMatch) {
        firstName = prenomMatch[1].trim();
        console.log("  → Prénom trouvé (pattern):", firstName);
      } else if (lines[i + 1]) {
        firstName = lines[i + 1]
          .replace(/[^A-ZÀÂÇÉÈÊËÎÏÔÙÛÜ\s\-']/g, "")
          .trim();
        console.log("  → Prénom trouvé (ligne suivante):", firstName);
      }
    }
  }

  // 4. Fallback
  if (!lastName || !firstName) {
    const upperLines = lines.filter(
      (l) =>
        l.length >= 3 &&
        l.length <= 30 &&
        /^[A-ZÀÂÇÉÈÊËÎÏÔÙÛÜ]{2,}/.test(l) &&
        !l.match(
          /^(REPUBLIQUE|TUNISIE|CARTE|NATIONALE|IDENTITE|IDENTITY|DATE|SEXE|NOM|PRENOM)/i,
        ),
    );

    if (!lastName && upperLines[0]) {
      lastName = upperLines[0];
      console.log("  → Nom trouvé (fallback):", lastName);
    }
    if (!firstName && upperLines[1]) {
      firstName = upperLines[1];
      console.log("  → Prénom trouvé (fallback):", firstName);
    }
  }

  return { cinNumber, lastName, firstName, dateOfBirth };
}

// ─── Parser VERSO CIN tunisienne (CORRIGÉ) ───────────────────────────────────────
function parseVerso(text: string): { profession?: string; cinNumber?: string } {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let profession: string | undefined;
  let cinNumber: string | undefined;

  console.log("📝 Parsing verso, lignes reçues:", lines);

  // Chercher le numéro CIN (8 chiffres) sur le verso
  const cinMatch = text.match(/\b(\d{8})\b/);
  if (cinMatch) {
    cinNumber = cinMatch[1];
    console.log("  → Numéro CIN trouvé sur verso:", cinNumber);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Chercher "المهنة" (profession en arabe)
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

// ─── Route principale ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    console.log("📮 POST /api/registration/upload-cin reçu");

    const formData = await request.formData();

    // ✅ Récupérer userId depuis Clerk
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const cinRectoFile = formData.get("cinRecto") as File | null;
    const cinVersoFile = formData.get("cinVerso") as File | null;
    const profileFile = formData.get("profilePhoto") as File | null;

    if (!cinRectoFile || !cinVersoFile || !profileFile) {
      console.error("❌ Fichiers manquants");
      return NextResponse.json(
        {
          error:
            "Les 3 fichiers sont requis : cinRecto, cinVerso, profilePhoto",
        },
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

    // ── Étape 2 : Google Vision OCR (en parallèle) ─────────────────────────
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

      console.log(
        "📄 Recto OCR (premiers 200 chars):",
        rectoText.substring(0, 200),
      );
      console.log(
        "📄 Verso OCR (premiers 200 chars):",
        versoText.substring(0, 200),
      );

      ocrSuccess = rectoText.length > 10;
    } catch (ocrError) {
      console.error("⚠️ OCR échoué (non bloquant):", ocrError);
      ocrSuccess = false;
    }

    // ── Étape 3 : Parser les données avec nettoyage ─────────────────────────
    const rectoData = parseRecto(rectoText);
    const versoData = parseVerso(versoText);

    // ✅ Priorité au numéro CIN du verso (plus fiable)
    const finalCinNumber = rectoData.cinNumber;

    // ✅ Fonctions de nettoyage
    const cleanName = (name: string | undefined) => {
      if (!name) return null;
      // \p{L} = TOUTES les lettres (latin, arabe, cyrillique, grec, etc.)
      // \s = espaces
      // \-' = tirets et apostrophes
      return name
        .replace(/[0-9]/g, "")
        .replace(/[^\p{L}\s\-']/gu, "")
        .trim();
    };

    const cleanCinNumber = (cin: string | undefined) => {
      if (!cin) return null;
      const match = cin.match(/\d{8}/);
      return match ? match[0] : null;
    };

    const extracted = {
      firstName: cleanName(rectoData.firstName),
      lastName: cleanName(rectoData.lastName),
      dateOfBirth: rectoData.dateOfBirth ?? null,
      cinNumber: cleanCinNumber(finalCinNumber),
      profession: versoData.profession ?? null,
    };
    const cinDataComplete = {
      firstName: extracted.firstName,
      lastName: extracted.lastName,
      cinNumber: extracted.cinNumber,
      dateOfBirth: extracted.dateOfBirth,
      profession: extracted.profession,
      extractedAt: new Date().toISOString(),
      documentType: "CIN",
      rectoUrl: cinRectoUrl,
      versoUrl: cinVersoUrl,
    };

    console.log("✅ Extraction terminée:", extracted);
    console.log("📦 cinData complet:", cinDataComplete);

    console.log("✅ Extraction terminée:", extracted);

    return NextResponse.json({
      success: true,
      ocrSuccess,
      extracted,
      cinData: cinDataComplete,
      cinNumber: extracted.cinNumber,
      urls: {
        cinRecto: cinRectoUrl,
        cinVerso: cinVersoUrl,
        profilePhoto: profilePhotoUrl,
      },
    });
  } catch (error) {
    console.error("❌ Erreur upload-cin:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur interne",
      },
      { status: 500 },
    );
  }
}
