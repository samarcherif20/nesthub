// app/api/users/me/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        username: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true,
        role: true,
        isIdentityVerified: true,
        status: true,
        email: true,
        phoneNumber: true,
        bio: true,
        createdAt: true,
        lastLogin: true,
        vacationMode: true,
        vacationMessage: true,
        vacationStartDate: true,
        vacationEndDate: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Calculer des stats factices ou les récupérer autrement
    const userWithStats = {
      ...user,
      stats: {
        totalActions: 0,
        actionsThisMonth: 0,
        accessLevel: 5,
      },
    };

    return NextResponse.json({ user: userWithStats });
  } catch (error) {
    console.error("[GET /api/users/me] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}