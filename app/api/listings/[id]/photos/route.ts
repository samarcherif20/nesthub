// app/api/listings/[id]/photos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import sharp from 'sharp';
import { ListingMedia } from '@prisma/client';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface PhotoReorderBody {
  photoIds: string[];
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
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
      include: { photos: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });
    }

    if (listing.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à modifier cette annonce' },
        { status: 403 }
      );
    }

    const currentPhotoCount = listing.photos.length;
    if (currentPhotoCount >= 20) {
      return NextResponse.json(
        { error: 'Maximum 20 photos par annonce' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];
    
    if (!files.length) {
      return NextResponse.json({ error: 'Aucune photo uploadée' }, { status: 400 });
    }

    if (currentPhotoCount + files.length > 20) {
      return NextResponse.json(
        { error: `Vous ne pouvez pas uploader plus de ${20 - currentPhotoCount} photos` },
        { status: 400 }
      );
    }

    const results: ListingMedia[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        continue;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: `La photo ${file.name} dépasse 10MB` },
          { status: 400 }
        );
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const timestamp = Date.now();
      const fileExt = file.type === 'image/png' ? 'png' : 'jpg';
      const fileName = `listings/${listingId}/photo-${timestamp}-${i}`;
      
      let imageBuffer = buffer;
      if (file.type !== 'image/gif') {
        imageBuffer = await sharp(buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80, progressive: true })
          .toBuffer();
      }
      
      const thumbnailBuffer = await sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 60 })
        .toBuffer();
      
      const [mainBlob, thumbBlob] = await Promise.all([
        put(`${fileName}.${fileExt}`, imageBuffer, {
          access: 'public',
          contentType: fileExt === 'png' ? 'image/png' : 'image/jpeg',
          addRandomSuffix: true,
        }),
        put(`${fileName}-thumb.${fileExt}`, thumbnailBuffer, {
          access: 'public',
          contentType: fileExt === 'png' ? 'image/png' : 'image/jpeg',
          addRandomSuffix: true,
        }),
      ]);
      
      const position = currentPhotoCount + results.length;
      const isFirstPhoto = currentPhotoCount === 0 && results.length === 0;
      
      const media = await prisma.listingMedia.create({
        data: {
          listingId,
          url: mainBlob.url,
          thumbnailUrl: thumbBlob.url,
          type: 'IMAGE',
          position,
          isMain: isFirstPhoto,
          fileSize: imageBuffer.length,
        },
      });
      
      results.push(media);
    }

    return NextResponse.json({
      success: true,
      photos: results,
    });

  } catch (error) {
    console.error('[POST /api/listings/:id/photos] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id: listingId } = await params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    if (!photoId) {
      return NextResponse.json({ error: 'photoId requis' }, { status: 400 });
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

    const photo = await prisma.listingMedia.findUnique({
      where: { id: photoId },
    });

    if (!photo || photo.listingId !== listingId) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 });
    }

    await prisma.listingMedia.delete({ where: { id: photoId } });
    
    const remainingPhotos = await prisma.listingMedia.findMany({
      where: { listingId },
      orderBy: { position: 'asc' },
    });
    
    for (let i = 0; i < remainingPhotos.length; i++) {
      await prisma.listingMedia.update({
        where: { id: remainingPhotos[i].id },
        data: { position: i },
      });
    }
    
    if (photo.isMain && remainingPhotos.length > 0) {
      await prisma.listingMedia.update({
        where: { id: remainingPhotos[0].id },
        data: { isMain: true },
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[DELETE /api/listings/:id/photos] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id: listingId } = await params;
    const body: PhotoReorderBody = await request.json();
    const { photoIds } = body;
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    if (!photoIds || !Array.isArray(photoIds)) {
      return NextResponse.json({ error: 'photoIds requis' }, { status: 400 });
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

    for (let i = 0; i < photoIds.length; i++) {
      await prisma.listingMedia.update({
        where: { id: photoIds[i] },
        data: { position: i },
      });
    }
    
    if (photoIds.length > 0) {
      await prisma.listingMedia.updateMany({
        where: { listingId },
        data: { isMain: false },
      });
      
      await prisma.listingMedia.update({
        where: { id: photoIds[0] },
        data: { isMain: true },
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[PATCH /api/listings/:id/photos] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}