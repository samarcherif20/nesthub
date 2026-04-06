// app/api/owner/team/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const body = await request.json();
    const { listingId, email, name, role, permissions, message } = body;

    if (!clerkId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    const listing = await prisma.listing.findFirst({
      where: { id: listingId, ownerId: user.id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Annonce non trouvée ou non autorisée' }, { status: 404 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await prisma.coOwnerInvitation.create({
      data: {
        listingId,
        inviterId: user.id,
        inviteeEmail: email,
        inviteeName: name,
        role: role || 'CO_HOST',
        permissions: permissions || null,
        token,
        message: message || null,
        expiresAt,
      },
    });

    // Si l'utilisateur existe déjà, on peut créer directement le team member
    if (existingUser) {
      await prisma.teamMember.create({
        data: {
          listingId,
          userId: existingUser.id,
          role: role || 'CO_HOST',
          permissions: permissions || null,
          canEdit: permissions?.canEdit || false,
          canManageBookings: permissions?.canManageBookings !== false,
          canViewRevenue: permissions?.canViewRevenue || false,
          canManageTeam: permissions?.canManageTeam || false,
          invitedBy: user.id,
          joinedAt: new Date(),
        },
      });
    }

    // TODO: Envoyer email d'invitation

    return NextResponse.json({ success: true, invitation });
  } catch (error) {
    console.error('[POST /api/owner/team/invite] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}