// app/api/users/[userId]/availability/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const { userId } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        availability: true,
        vacationMode: true,
        vacationMessage: true,
        vacationStartDate: true,
        vacationEndDate: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier si l'utilisateur est en vacances
    let isOnVacation = user.vacationMode;
    let vacationMessage = user.vacationMessage;

    if (user.vacationStartDate && user.vacationEndDate) {
      const now = new Date();
      const start = new Date(user.vacationStartDate);
      const end = new Date(user.vacationEndDate);
      
      if (now >= start && now <= end) {
        isOnVacation = true;
      }
    }

    return NextResponse.json({
      availability: user.availability || [],
      vacationMode: isOnVacation,
      vacationMessage: vacationMessage || null,
    });
  } catch (error) {
    console.error("[GET /api/users/:userId/availability] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des disponibilités" },
      { status: 500 }
    );
  }
}