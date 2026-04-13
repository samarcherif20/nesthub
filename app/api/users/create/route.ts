import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("📦 Données reçues:", body);

    const {
      userId,
      email,
      username,
      role,
      preferredLocale,
      profilePictureUrl,
    } = body;

    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 },
      );
    }

    // Vérifier si le username existe déjà
    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Ce nom d'utilisateur est déjà pris" },
        { status: 400 },
      );
    }

    // Convertir le rôle string en enum Prisma
    const userRole = role === "landlord" ? "PROPERTY_OWNER" : "TENANT";

    console.log("📝 Tentative de création avec:", {
      clerkId: userId,
      email,
      username,
      role: userRole,
      preferredLocale: preferredLocale || "fr",
      profilePictureUrl: profilePictureUrl || null,
    });

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: email,
        username: username,
        firstName: null,
        lastName: null,
        phoneNumber: null,
        status: "PENDING_VALIDATION", // ← AJOUTE CETTE LIGNE
        role: userRole,
        preferredLocale: preferredLocale || "fr",
        profilePictureUrl: profilePictureUrl || null, // ✅ AJOUTER CETTE LIGNE
        updatedAt: new Date(),
      },
    });

    console.log("✅ Utilisateur créé:", user);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("❌ ERREUR COMPLÈTE:", error);
    if (error.code) {
      console.error("📌 Code erreur Prisma:", error.code);
      console.error("📌 Message:", error.message);
      console.error("📌 Meta:", error.meta);
    }

    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error.message,
        code: error.code,
      },
      { status: 500 },
    );
  }
}
