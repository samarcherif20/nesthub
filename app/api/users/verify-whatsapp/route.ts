import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { onUserVerified } from "@/lib/risk-scoring";

export async function POST(req: Request) {
  try {
    const { userId, phoneNumber, code } = await req.json();

    console.log("verify-whatsapp appelé");
    console.log("Données reçues:", { userId, phoneNumber, code });

    if (!userId || !phoneNumber || !code) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 },
      );
    }

    // ✅ Trouver l'utilisateur avec son clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      console.error("Utilisateur non trouvé pour clerkId:", userId);
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    console.log("Utilisateur trouvé:", { id: user.id, clerkId: user.clerkId });

    // ✅ Nettoyer les OTP expirés avant de vérifier
    await prisma.otpCode.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    // ✅ Vérifier le code en BASE DE DONNÉES (pas en mémoire)
    const dbOtp = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,  // Utiliser l'UUID
        phoneNumber: phoneNumber,
        code: code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!dbOtp) {
      console.log("OTP non trouvé ou invalide pour user.id:", user.id);
      return NextResponse.json(
        { error: "Code invalide ou expiré" },
        { status: 400 },
      );
    }

    console.log("OTP trouvé en BDD:", dbOtp.id);

    // ✅ Marquer le code comme utilisé
    await prisma.otpCode.update({
      where: { id: dbOtp.id },
      data: { used: true },
    });

    // ✅ Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        phoneNumber: phoneNumber,
        isPhoneVerified: true,
        phoneVerifiedAt: new Date(),
      },
    });

    console.log("✅ Phone verified pour:", userId);

    // Déclencher le recalcul du score (si la fonction existe)
    try {
      if (typeof onUserVerified === 'function') {
        await onUserVerified(userId);
      }
    } catch (error) {
      console.error("Erreur lors du scoring:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Numéro vérifié avec succès",
    });
    
  } catch (error: any) {
    console.error("❌ Erreur verify-whatsapp:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}