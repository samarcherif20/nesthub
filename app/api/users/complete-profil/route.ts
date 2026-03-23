import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const {
      userId,
      firstName,
      lastName,
      dateNaissance,
      cinNumber,
      address,
      bio,
      phoneNumber,
      languages,
      gender,
      occupation,
    } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis" },
        { status: 400 }
      );
    }

    // Mettre à jour le user dans Prisma
    const updatedUser = await prisma.user.update({
      where: { clerkId: userId },
      data: {
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
        bio: bio || undefined,
        spokenLanguages: languages || [],
        status: "ACTIVE",
      },
    });

    // Créer ou mettre à jour la vérification d'identité
    if (cinNumber || dateNaissance) {
      await prisma.identityVerification.upsert({
        where: { userId: updatedUser.id },
        update: {
          submissionDate: new Date(),
          status: "PENDING",
          adminComment: `CIN: ${cinNumber || "N/A"} | Né(e) le: ${dateNaissance || "N/A"} | Adresse: ${address || "N/A"} | Genre: ${gender || "N/A"} | Occupation: ${occupation || "N/A"}`,
        },
        create: {
          userId: updatedUser.id,
          submissionDate: new Date(),
          status: "PENDING",
          adminComment: `CIN: ${cinNumber || "N/A"} | Né(e) le: ${dateNaissance || "N/A"} | Adresse: ${address || "N/A"} | Genre: ${gender || "N/A"} | Occupation: ${occupation || "N/A"}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Profil complété avec succès",
    });

  } catch (error: any) {
    console.error("❌ Erreur complete-profile:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}