import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📦 Body reçu:", body);

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
      governorate,
      delegation,
      howFound,
      rib,
      bankName,
      accountHolder,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: existingUser.id },
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
        gender: gender || undefined,
        howFound: howFound || undefined,
        rib: rib || undefined,
        bankName: bankName || undefined,
        accountHolder: accountHolder || undefined,
        isEmailVerified: true,
        status: "PENDING_VALIDATION",
      },
    });

    console.log("✅ Utilisateur mis à jour:", {
      id: updatedUser.id,
      role: updatedUser.role,
    });

    // Créer ou mettre à jour la vérification d'identité si CIN présent
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
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("❌ Erreur complete-profile:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
