// app/api/admin/serve-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const blobUrl = req.nextUrl.searchParams.get('url');
    if (!blobUrl) {
      return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
    }

    console.log('[serve-image] Récupération de:', blobUrl);

    // Récupérer l'image avec le token d'accès
    const response = await fetch(blobUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    });
    
    if (!response.ok) {
      console.error('[serve-image] Échec fetch:', response.status);
      return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 });
    }
    
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Retourner l'image directement
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': 'inline',
      },
    });
    
  } catch (error) {
    console.error('[serve-image] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}