import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

// Fonctions de parsing (copiées depuis upload-cin)
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

function parseRecto(text: string): {
  cinNumber?: string;
  lastName?: string;
  firstName?: string;
  dateOfBirth?: string;
} {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let cinNumber: string | undefined;
  let lastName: string | undefined;
  let firstName: string | undefined;
  let dateOfBirth: string | undefined;

  const cinMatch = text.match(/\b(\d{8})\b/);
  if (cinMatch) cinNumber = cinMatch[1];

  const dateMatch = text.match(
    /(\d{1,2})\s+(جانفي|فيفري|مارس|افريل|ماي|جوان|جويلية|اوت|سبتمبر|اكتوبر|نوفمبر|ديسمبر)\s+(\d{4})/,
  );
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, "0");
    const month = arabicMonths[dateMatch[2]];
    const year = dateMatch[3];
    if (month) dateOfBirth = `${year}-${month}-${day}`;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("اللقب")) {
      let nameValue = line.replace("اللقب", "").trim();
      if (nameValue && nameValue.length > 0 && nameValue !== "الجمهورية التونسية") {
        lastName = nameValue;
      } else if (lines[i + 1] && !lines[i + 1].includes("الاسم")) {
        lastName = lines[i + 1];
      }
    }
    if (line.includes("الاسم")) {
      let nameValue = line.replace("الاسم", "").trim();
      if (nameValue && nameValue.length > 0 && nameValue !== "الجمهورية التونسية") {
        firstName = nameValue;
      } else if (lines[i + 1]) {
        firstName = lines[i + 1];
      }
    }
  }

  return { cinNumber, lastName, firstName, dateOfBirth };
}

function parseVerso(text: string): { profession?: string } {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let profession: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("المهنة")) {
      let profPart = line.split("المهنة")[1]?.trim();
      if (!profPart || profPart.length === 0) {
        profPart = lines[i + 1]?.trim();
      }
      if (profPart && profPart.length > 0) {
        profession = profPart;
      }
      break;
    }
    if (line.toUpperCase().includes("PROFESSION")) {
      const parts = line.split(/PROFESSION\s*:?\s*/i);
      if (parts.length > 1 && parts[1].trim()) {
        profession = parts[1].trim();
      } else if (lines[i + 1]) {
        profession = lines[i + 1].trim();
      }
      break;
    }
  }

  if (profession) {
    profession = profession.replace(/[^\w\s\u0600-\u06FF\-']/g, "").trim();
  }
  return { profession };
}

function cleanName(name: string | undefined): string | null {
  if (!name) return null;
  let cleaned = name.replace(/[0-9]/g, "").replace(/[^\p{L}\s\-']/gu, "").trim().substring(0, 50);
  if (cleaned.length < 2) return null;
  if (cleaned === "الجمهورية التونسية") return null;
  if (cleaned === "بطاقة التعريف الوطنية") return null;
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    const body = await request.json();
    
    const {
      cinRectoUrl,
      cinVersoUrl,
      profilePictureUrl,
      firstName,
      lastName,
      phoneNumber,
      governorate,
      delegation,
      bio,
      profession,
      dateNaissance,
      cinNumber,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("📮 POST /api/registration/process-ocr reçu pour userId:", userId);
    console.log("📸 URLs:", { cinRectoUrl, cinVersoUrl, profilePictureUrl });

    // Télécharger les images depuis les URLs
    const fetchImageAsBase64 = async (url: string) => {
      console.log(`📥 Téléchargement depuis: ${url}`);
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      console.log(`✅ Téléchargé: ${buffer.byteLength} bytes`);
      return Buffer.from(buffer).toString("base64");
    };

    const [rectoBase64, versoBase64] = await Promise.all([
      fetchImageAsBase64(cinRectoUrl),
      fetchImageAsBase64(cinVersoUrl),
    ]);

    // Appeler Google Vision OCR
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    console.log("🔍 Appel Google Vision OCR...");
    
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: [
            {
              image: { content: rectoBase64 },
              features: [{ type: "TEXT_DETECTION" }],
            },
            {
              image: { content: versoBase64 },
              features: [{ type: "TEXT_DETECTION" }],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error("❌ Google Vision error:", errorText);
      throw new Error(`Google Vision error: ${errorText}`);
    }

    const visionData = await visionResponse.json();
    const rectoText = visionData.responses?.[0]?.fullTextAnnotation?.text || "";
    const versoText = visionData.responses?.[1]?.fullTextAnnotation?.text || "";

    console.log("📄 Recto OCR (extrait):", rectoText.substring(0, 200));
    console.log("📄 Verso OCR (extrait):", versoText.substring(0, 200));

    // Parser les données
    const rectoData = parseRecto(rectoText);
    const versoData = parseVerso(versoText);

    const extracted = {
      firstName: cleanName(rectoData.firstName),
      lastName: cleanName(rectoData.lastName),
      cinNumber: rectoData.cinNumber || null,
      dateOfBirth: rectoData.dateOfBirth || null,
      profession: versoData.profession || null,
    };

    console.log("✅ Extraction terminée:", extracted);

    // ✅ Sauvegarder en base de données - Utiliser l'URL absolue
    const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`;
    const saveRes = await fetch(`${baseUrl}/api/users/complete-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        firstName: firstName || "",
        lastName: lastName || "",
        phoneNumber: phoneNumber || "",
        governorate: governorate || "",
        delegation: delegation || "",
        bio: bio || "",
        profession: profession || extracted.profession || "",
        dateNaissance: dateNaissance || extracted.dateOfBirth || "",
        cinNumber: cinNumber || extracted.cinNumber || "",
        cinRectoUrl: cinRectoUrl || "",
        cinVersoUrl: cinVersoUrl || "",
        profilePictureUrl: profilePictureUrl || "",
        cinData: extracted,
      }),
    });

    if (!saveRes.ok) {
      const errorData = await saveRes.json();
      console.error("❌ Erreur sauvegarde:", errorData);
      throw new Error(errorData.error || "Erreur sauvegarde");
    }

    const saveData = await saveRes.json();
    console.log("✅ Sauvegarde réussie:", saveData);

    return NextResponse.json({ success: true, extracted });

  } catch (error) {
    console.error("❌ Erreur process-ocr:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur OCR" },
      { status: 500 }
    );
  }
}