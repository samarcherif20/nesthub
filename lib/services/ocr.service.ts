import vision from '@google-cloud/vision';

export interface CINExtracted {
  cinNumber:    string | null;
  firstName:    string | null;
  lastName:     string | null;
  dateOfBirth:  string | null;
  placeOfBirth: string | null;
  expiryDate:   string | null;
  gender:       string | null;
  rawText:      string;
  confidence:   number;
}

function getClient() {
  const privateKey = process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n');

  return new vision.ImageAnnotatorClient({
    credentials: {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key:  privateKey,
    },
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  });
}

export async function extractCINData(
  rectoBuffer: Buffer,
  versoBuffer: Buffer
): Promise<CINExtracted> {

  const client = getClient();

  // Envoie recto ET verso en parallèle
  const [rectoResult, versoResult] = await Promise.all([
    client.textDetection({ image: { content: rectoBuffer.toString('base64') } }),
    client.textDetection({ image: { content: versoBuffer.toString('base64') } }),
  ]);

  const rectoText = rectoResult[0]?.fullTextAnnotation?.text || '';
  const versoText = versoResult[0]?.fullTextAnnotation?.text || '';
  const fullText  = `${rectoText}\n${versoText}`;
  const upper     = fullText.toUpperCase();

  // ── Parser les données CIN tunisienne ──────────────────────────────

  // Numéro CIN : 8 chiffres
  const cinMatch = upper.match(/\b(\d{8})\b/);
  const cinNumber = cinMatch ? cinMatch[1] : null;

  // Nom de famille (après NOM: ou avant PRENOM)
  const lastNameMatch = upper.match(
    /(?:NOM\s*[:\-]?\s*)([A-ZÀ-Ü\s\-]{2,30})(?=\s*(?:PRENOM|PR[EÉ]NOM|$))/
  );
  const lastName = lastNameMatch
    ? lastNameMatch[1].trim().replace(/\s+/g, ' ')
    : null;

  // Prénom
  const firstNameMatch = upper.match(
    /(?:PR[EÉ]NOM\s*[:\-]?\s*)([A-ZÀ-Ü\s\-]{2,30})(?=\s*(?:N[EÉ]|DATE|LIEU|$))/
  );
  const firstName = firstNameMatch
    ? firstNameMatch[1].trim().replace(/\s+/g, ' ')
    : null;

  // Date de naissance (formats: 01/01/1990 ou 01-01-1990)
  const dateMatch = upper.match(
    /(?:N[EÉ]\s*LE|DATE\s*(?:DE\s*)?NAISSANCE\s*[:\-]?\s*)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/
  );
  let dateOfBirth: string | null = null;
  if (dateMatch) {
    const parts = dateMatch[1].split(/[\/\-]/);
    dateOfBirth = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }

  // Lieu de naissance
  const placeMatch = upper.match(
    /(?:LIEU\s*(?:DE\s*)?NAISSANCE\s*[:\-]?\s*)([A-ZÀ-Ü\s\-]{2,40})(?=\s*(?:ADRESSE|ADR|NAT|$))/
  );
  const placeOfBirth = placeMatch
    ? placeMatch[1].trim().replace(/\s+/g, ' ')
    : null;

  // Date d'expiration
  const expiryMatch = upper.match(
    /(?:VALABLE\s*JUSQU|EXPIR[EY]|DATE\s*(?:D[\'']?EXPIR))\D{0,10}(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/
  );
  let expiryDate: string | null = null;
  if (expiryMatch) {
    const parts = expiryMatch[1].split(/[\/\-]/);
    expiryDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }

  // Genre
  const genderMatch = upper.match(/\b(MASCULIN|FEMININ|FÉMININ|MALE|FEMALE|[MF])\b/);
  let gender: string | null = null;
  if (genderMatch) {
    const g = genderMatch[1];
    gender = (g === 'MASCULIN' || g === 'MALE' || g === 'M') ? 'M' : 'F';
  }

  // Score de confiance basé sur ce qu'on a réussi à extraire
  const fields   = [cinNumber, firstName, lastName, dateOfBirth];
  const found    = fields.filter(Boolean).length;
  const confidence = found / fields.length;

  return {
    cinNumber,
    firstName,
    lastName,
    dateOfBirth,
    placeOfBirth,
    expiryDate,
    gender,
    rawText: fullText,
    confidence,
  };
}