// app/api/users/complete-profile/route.ts

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
      profession,
      bio,
      phoneNumber,
      languages,
      gender,
      occupation,
      governorate,
      delegation,
      cinData,
      profilePictureUrl,
    } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
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
        profession: profession || undefined,
        cinNumber: cinNumber || undefined,
        dateOfBirth: dateNaissance ? new Date(dateNaissance) : undefined,
        governorate: governorate || undefined,
        delegation: delegation || undefined,
        cinData: cinData || undefined,
        profilePictureUrl: profilePictureUrl || undefined,
        isEmailVerified: true,
        status: "PENDING_VALIDATION",
      },
    });

    console.log("✅ Utilisateur mis à jour:", {
      id: updatedUser.id,
      profilePictureUrl: updatedUser.profilePictureUrl,
    });

    // Créer ou mettre à jour la vérification d'identité
    if (cinNumber || dateNaissance) {
      await prisma.identityVerification.upsert({
        where: { userId: updatedUser.id },
        update: {
          submissionDate: new Date(),
          status: "PENDING",
          adminComment: `CIN: ${cinNumber || "N/A"} | Né(e) le: ${dateNaissance || "N/A"}`,
        },
        create: {
          userId: updatedUser.id,
          submissionDate: new Date(),
          status: "PENDING",
          adminComment: `CIN: ${cinNumber || "N/A"} | Né(e) le: ${dateNaissance || "N/A"}`,
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
      { status: 500 },
    );
  }
}
