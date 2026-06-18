// app/api/admin/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminAuth, isAuthError } from '@/lib/auth-admin';

export async function GET(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    console.log(' Recherche admin avec clerkId:', auth.userId);
    
    const admin = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        profilePictureUrl: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        bio: true,
      }
    });

    if (!admin) {
      console.log(' Admin non trouvé avec clerkId:', auth.userId);
      return NextResponse.json(
        { error: 'Admin non trouvé' },
        { status: 404 }
      );
    }

    console.log(' Admin trouvé:', admin.email);

    // Statistiques (à adapter selon votre logique métier)
    const totalActions = await prisma.userAction.count({
      where: { performedBy: admin.id }
    });

    const actionsThisMonth = await prisma.userAction.count({
      where: {
        performedBy: admin.id,
        createdAt: {
          gte: new Date(new Date().setDate(1)) // Premier jour du mois
        }
      }
    });

    // Sessions (à implémenter avec votre système de sessions)
    const sessions = [
      {
        id: '1',
        device: 'MacBook Pro',
        browser: 'Chrome',
        location: 'Paris, France',
        ip: '192.168.1.45',
        lastActive: 'Maintenant',
        isCurrent: true,
      },
      {
        id: '2',
        device: 'iPhone 15',
        browser: 'Safari',
        location: 'Lyon, France',
        ip: '192.168.1.78',
        lastActive: 'Il y a 2 heures',
        isCurrent: false,
      },
    ];

    return NextResponse.json({
      profile: {
        ...admin,
        stats: {
          totalActions: totalActions || 0,
          actionsThisMonth: actionsThisMonth || 0,
          accessLevel: admin.role === 'ADMIN' ? 5 : 3,
        }
      },
      sessions,
    });

  } catch (error) {
    console.error(' Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { firstName, lastName, email, phoneNumber, bio } = body;

    console.log(' Mise à jour profil pour:', auth.userId);

    const updatedAdmin = await prisma.user.update({
      where: { clerkId: auth.userId },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        bio,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        bio: true,
      }
    });

    console.log(' Profil mis à jour:', updatedAdmin.email);

    return NextResponse.json({ 
      success: true, 
      profile: updatedAdmin 
    });

  } catch (error) {
    console.error(' Error updating profile:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}