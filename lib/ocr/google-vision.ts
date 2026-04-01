// lib/ocr/google-vision.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as fs from 'fs';
import * as path from 'path';

let client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (!client) {
    client = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
  return client;
}

export interface ExtractedCINData {
  cinNumber: string | null;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  expiryDate: string | null;
  gender: 'M' | 'F' | null;
  rawText: string;
  confidence: number;
}

// Mois en arabe pour la conversion
const arabicMonths: Record<string, string> = {
  'جانفي': '01', 'فيفري': '02', 'مارس': '03', 'أفريل': '04',
  'ماي': '05', 'جوان': '06', 'جويلية': '07', 'أوت': '08',
  'سبتمبر': '09', 'أكتوبر': '10', 'نوفمبر': '11', 'ديسمبر': '12',
  'يناير': '01', 'فبراير': '02', 'مارس': '03', 'ابريل': '04',
  'مايو': '05', 'يونيو': '06', 'يوليو': '07', 'اغسطس': '08'
};

function extractCINNumber(text: string): string | null {
  const match = text.match(/\b\d{8}\b/);
  if (match) return match.group(0);
  
  // Chercher 7 chiffres (ajouter 0 devant)
  const match7 = text.match(/\b\d{7}\b/);
  if (match7) return '0' + match7.group(0);
  
  return null;
}

function extractDateOfBirth(text: string): string | null {
  // Format: JJ Mois AAAA
  for (const [monthAr, monthNum] of Object.entries(arabicMonths)) {
    const pattern = new RegExp(`(\\d{1,2})\\s*${monthAr}\\s*(\\d{4})`, 'i');
    const match = text.match(pattern);
    if (match) {
      return `${match[1]}/${monthNum}/${match[2]}`;
    }
  }
  
  // Format: JJ/MM/AAAA
  const slashMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    return `${slashMatch[1]}/${slashMatch[2]}/${slashMatch[3]}`;
  }
  
  // Format: JJ-MM-AAAA
  const dashMatch = text.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dashMatch) {
    return `${dashMatch[1]}/${dashMatch[2]}/${dashMatch[3]}`;
  }
  
  return null;
}

function extractName(text: string): { firstName: string | null; lastName: string | null } {
  let firstName = null;
  let lastName = null;
  
  // Chercher "اللقب" (nom de famille)
  const lastNameMatch = text.match(/(?:اللقب|لقب)[:\s]*([\u0600-\u06FF]{2,15})/);
  if (lastNameMatch) {
    lastName = lastNameMatch[1];
  }
  
  // Chercher "الاسم" (prénom)
  const firstNameMatch = text.match(/(?:الاسم|اسم)[:\s]*([\u0600-\u06FF]{2,15})/);
  if (firstNameMatch) {
    firstName = firstNameMatch[1];
  }
  
  return { firstName, lastName };
}

function extractPlaceOfBirth(text: string): string | null {
  const cities = ['تونس', 'سوسة', 'صفاقس', 'بنزرت', 'نابل', 'قابس', 'قفصة', 'المنستير', 'المهدية'];
  for (const city of cities) {
    if (text.includes(city)) {
      return city;
    }
  }
  return null;
}

export async function extractCINFromImage(imageBuffer: Buffer): Promise<ExtractedCINData> {
  try {
    const visionClient = getClient();
    
    const [result] = await visionClient.textDetection({
      image: { content: imageBuffer.toString('base64') },
    });
    
    const fullText = result.textAnnotations?.[0]?.description || '';
    const confidence = result.textAnnotations?.[0]?.confidence || 0.8;
    
    console.log('📝 Google Vision - Texte détecté:', fullText.substring(0, 200));
    
    const { firstName, lastName } = extractName(fullText);
    
    return {
      cinNumber: extractCINNumber(fullText),
      firstName,
      lastName,
      dateOfBirth: extractDateOfBirth(fullText),
      placeOfBirth: extractPlaceOfBirth(fullText),
      expiryDate: null,
      gender: null,
      rawText: fullText,
      confidence: confidence * 100,
    };
    
  } catch (error) {
    console.error('❌ Google Vision error:', error);
    throw error;
  }
}

export async function extractCINFromImagePath(imagePath: string): Promise<ExtractedCINData> {
  const imageBuffer = fs.readFileSync(imagePath);
  return extractCINFromImage(imageBuffer);
}