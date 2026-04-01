// app/api/registration/upload-cin/route.ts
export const runtime = 'nodejs';
export const maxDuration = 30;

import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const clerkId = formData.get('userId') as string;
    const cinRecto = formData.get('cinRecto') as File;
    const cinVerso = formData.get('cinVerso') as File;
    const profilePhoto = formData.get('profilePhoto') as File;

    if (!clerkId || !cinRecto || !cinVerso || !profilePhoto) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    console.log('📸 Upload pour clerkId:', clerkId);

    // Lire les buffers
    const [rectoBuf, versoBuf, photoBuf] = await Promise.all([
      cinRecto.arrayBuffer().then(b => Buffer.from(b)),
      cinVerso.arrayBuffer().then(b => Buffer.from(b)),
      profilePhoto.arrayBuffer().then(b => Buffer.from(b)),
    ]);

    // ── 1. Upload Vercel Blob ─────────────────────────────────────────────
    const ts = Date.now();
    const [rectoBlob, versoBlob, photoBlob] = await Promise.all([
      put(`users/${clerkId}/cin-recto-${ts}`, rectoBuf, { 
        access: 'private',
        contentType: cinRecto.type,
        addRandomSuffix: true 
      }),
      put(`users/${clerkId}/cin-verso-${ts}`, versoBuf, { 
        access: 'private',
        contentType: cinVerso.type,
        addRandomSuffix: true 
      }),
      put(`users/${clerkId}/selfie-${ts}`, photoBuf, { 
        access: 'private',
        contentType: profilePhoto.type,
        addRandomSuffix: true 
      }),
    ]);

    console.log('✅ Uploads Vercel Blob réussis');

    // ── 2. OCR DÉSACTIVÉ TEMPORAIREMENT ──────────────────────────────────
    const extracted = {
      cinNumber: '12345678',
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      placeOfBirth: 'Tunis',
      expiryDate: '2030-01-01',
      gender: 'M',
      rawText: 'Test OCR désactivé',
      confidence: 100,
    };
    const ocrSuccess = true;

    console.log('📝 OCR désactivé - données factices utilisées');

    // ── 3. Chercher l'utilisateur par clerkId ──────────────────────────────
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkId }
    });

    if (!user) {
      console.log('⚠️ Utilisateur non trouvé pour clerkId:', clerkId);
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé. Veuillez compléter l\'étape 1 d\'abord.' 
      }, { status: 404 });
    }

    console.log('✅ Utilisateur trouvé:', user.id, user.email);

    // ── 4. Mettre à jour l'utilisateur (sans dateNaissance) ────────────────
    await prisma.user.update({
      where: { id: user.id },
      data: {
        profilePictureUrl: photoBlob.url,
        cinNumber: extracted.cinNumber,
        cinData: extracted as object,
        firstName: extracted.firstName,
        lastName: extracted.lastName,
        // ✅ Pas de dateNaissance - les dates sont dans cinData
        isIdentityVerified: false,
      },
    });

    // ── 5. Créer la demande de vérification ────────────────────────────────
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId: user.id,
        documentFrontUrl: rectoBlob.url,
        documentBackUrl: versoBlob.url,
        selfieUrl: photoBlob.url,
        extractedData: extracted as object,
        rawOcrText: extracted.rawText,
        ocrSuccess,
        confidenceScore: extracted.confidence,
        status: 'PENDING',
      },
    });

    console.log('✅ Demande de vérification créée:', verificationRequest.id);

    return NextResponse.json({
      success: true,
      ocrSuccess,
      cinNumber: extracted.cinNumber,
      confidence: extracted.confidence,
      extracted,
      urls: {
        cinRecto: rectoBlob.url,
        cinVerso: versoBlob.url,
        profilePhoto: photoBlob.url,
      },
    });

  } catch (error) {
    console.error('[upload-cin] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}