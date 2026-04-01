// app/api/listings/[id]/upload-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAuth } from '@clerk/nextjs/server';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id: listingId } = await params;
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { ownerId: true },
    });

    if (!listing || listing.ownerId !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Aucune photo' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const timestamp = Date.now();
    const fileExt = file.type === 'image/png' ? 'png' : 'jpg';
    const fileName = `listings/${listingId}/photo-${timestamp}`;
    
    // Optimiser l'image
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
    
    const thumbnailBuffer = await sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 60 })
      .toBuffer();
    
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
    
    // Compter les photos existantes
    const existingPhotos = await prisma.listingMedia.count({
      where: { listingId },
    });
    
    const media = await prisma.listingMedia.create({
      data: {
        listingId,
        url: mainBlob.url,
        thumbnailUrl: thumbBlob.url,
        type: 'IMAGE',
        position: existingPhotos,
        isMain: existingPhotos === 0,
      },
    });
    
    return NextResponse.json(media);
    
  } catch (error) {
    console.error('[POST /api/listings/:id/upload-photo] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}