// app/api/listings/upload-temp-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAuth } from '@clerk/nextjs/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Cache pour le logo
let cachedLogoBuffer: Buffer | null = null;

/**
 * Charge le logo NestHub depuis le dossier public
 */
async function getLogoBuffer(): Promise<Buffer> {
  if (cachedLogoBuffer) return cachedLogoBuffer;
  
  // Essayer de charger depuis le dossier public
  const logoPaths = [
    path.join(process.cwd(), 'public', 'logo', 'logo.png'),
    path.join(process.cwd(), 'public', 'logo.png'),
    path.join(process.cwd(), 'public', 'nesthub-logo.png'),
  ];
  
  for (const logoPath of logoPaths) {
    try {
      if (fs.existsSync(logoPath)) {
        cachedLogoBuffer = await sharp(fs.readFileSync(logoPath))
          .resize(200, 200, { fit: 'contain' })
          .png()
          .toBuffer();
        console.log('✅ Logo chargé depuis:', logoPath);
        return cachedLogoBuffer;
      }
    } catch (error) {
      console.error('Erreur chargement logo depuis', logoPath, error);
    }
  }
  
  // Fallback: créer un logo texte avec le nom NESTHUB
  console.log('⚠️ Aucun logo trouvé, création d\'un logo texte');
  cachedLogoBuffer = await sharp({
    text: {
      text: 'NESTHUB',
      font: 'Arial',
      fontsize: 90,
      rgba: true,
      width: 400,
      height: 120,
    },
  })
    .png()
    .toBuffer();
  
  return cachedLogoBuffer;
}

/**
 * Crée un watermark avec le logo et le nom NESTHUB
 */
async function createWatermarkWithName(width: number, height: number): Promise<Buffer> {
  // Calculer la taille du watermark (20% de la largeur)
  const watermarkWidth = Math.floor(width * 0.2);
  const watermarkHeight = Math.floor(watermarkWidth * 0.6); // Ratio hauteur/largeur
  
  // SVG avec le nom NESTHUB
  const svgWatermark = `
    <svg width="${watermarkWidth}" height="${watermarkHeight}" viewBox="0 0 ${watermarkWidth} ${watermarkHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${watermarkWidth}" height="${watermarkHeight}" rx="${Math.floor(watermarkWidth * 0.1)}" fill="#0df293" fill-opacity="0.9"/>
      <text x="${watermarkWidth / 2}" y="${watermarkHeight / 2 + 8}" font-family="Arial, sans-serif" font-size="${Math.floor(watermarkHeight * 0.4)}" font-weight="bold" text-anchor="middle" fill="#10221b">NESTHUB</text>
    </svg>
  `;
  
  return Buffer.from(svgWatermark);
}

/**
 * Ajoute un watermark avec le nom NESTHUB sur l'image
 * Position: HAUT À DROITE avec marge de 20px
 * Taille: 20% de la largeur de l'image
 */
async function addWatermarkWithName(imageBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  const { width = 1200, height = 800 } = metadata;
  
  // Créer le watermark avec le nom
  const watermarkBuffer = await createWatermarkWithName(width, height);
  
  // Calculer les dimensions du watermark
  const watermarkWidth = Math.floor(width * 0.2);
  const watermarkHeight = Math.floor(watermarkWidth * 0.6);
  const margin = 20;
  
  // Position en HAUT À DROITE
  const left = width - watermarkWidth - margin;
  const top = margin;
  
  // Ajouter le watermark
  return await image
    .composite([
      {
        input: watermarkBuffer,
        top,
        left,
        blend: 'over',
      },
    ])
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
}

/**
 * Version avec logo personnalisé + nom
 */
async function addWatermarkWithLogo(imageBuffer: Buffer, logoBuffer: Buffer): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  const { width = 1200, height = 800 } = metadata;
  
  // Taille du logo (15% de la largeur)
  const logoWidth = Math.floor(width * 0.15);
  const logoHeight = Math.floor((logoWidth / 200) * 200);
  const margin = 20;
  
  // Position en HAUT À DROITE
  const left = width - logoWidth - margin;
  const top = margin;
  
  // Redimensionner le logo
  const resizedLogo = await sharp(logoBuffer)
    .resize(logoWidth, logoHeight, { fit: 'contain' })
    .png()
    .toBuffer();
  
  // Ajouter le logo
  return await image
    .composite([
      {
        input: resizedLogo,
        top,
        left,
        blend: 'over',
      },
    ])
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
}

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('photos') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucune photo' }, { status: 400 });
    }
    
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Format non supporté' }, { status: 400 });
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Photo trop lourde (max 10MB)' }, { status: 400 });
    }
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const fileExt = file.type === 'image/png' ? 'png' : 'jpg';
    const fileName = `listings/temp/${clerkId}-${timestamp}-${randomId}`;
    
    // Choisir la méthode de watermark :
    // Option 1: Uniquement le nom NESTHUB (plus propre)
    const watermarkedBuffer = await addWatermarkWithName(buffer);
    
    // Option 2: Logo personnalisé + nom (décommente pour utiliser)
    // const logoBuffer = await getLogoBuffer();
    // const watermarkedBuffer = await addWatermarkWithLogo(buffer, logoBuffer);
    
    // Optimiser l'image avec watermark
    const optimizedBuffer = await sharp(watermarkedBuffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    
    // Générer une miniature (sans watermark pour performance)
    const thumbnailBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 60 })
      .toBuffer();
    
    // Upload sur Vercel Blob
    const [mainBlob, thumbBlob] = await Promise.all([
      put(`${fileName}.${fileExt}`, optimizedBuffer, {
        access: 'private',
        contentType: fileExt === 'png' ? 'image/png' : 'image/jpeg',
        addRandomSuffix: true,
      }),
      put(`${fileName}-thumb.${fileExt}`, thumbnailBuffer, {
        access: 'private',
        contentType: fileExt === 'png' ? 'image/png' : 'image/jpeg',
        addRandomSuffix: true,
      }),
    ]);
    
    console.log('✅ Photo uploadée avec watermark "NESTHUB" (haut droite):', mainBlob.url);
    
    return NextResponse.json({
      success: true,
      url: mainBlob.url,
      thumbnailUrl: thumbBlob.url,
    });
    
  } catch (error) {
    console.error('[POST /api/listings/upload-temp-photo] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}