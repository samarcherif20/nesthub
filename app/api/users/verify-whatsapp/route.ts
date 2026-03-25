import { NextResponse } from "next/server";
import { otpStore } from "../add-whatsapp/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, phoneNumber, code } = await req.json();

    console.log("🔍 verify-whatsapp appelé");
    console.log("📦 Données reçues:", { userId, phoneNumber, code });
    console.log("📦 OTP store size:", otpStore.size);
    console.log("📦 OTP store keys:", Array.from(otpStore.keys()));

    if (!userId || !phoneNumber || !code) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 },
      );
    }

    // Vérifier le code en mémoire
    const stored = otpStore.get(userId);

    console.log(
      "📦 OTP stocké pour",
      userId,
      ":",
      stored
        ? {
            code: stored.code,
            phone: stored.phone,
            expiresAt: stored.expiresAt,
            isExpired: stored.expiresAt < new Date(),
          }
        : "AUCUN OTP TROUVÉ",
    );

    if (!stored) {
      return NextResponse.json(
        { error: "Aucun code trouvé. Demandez un nouveau code." },
        { status: 400 },
      );
    }

    // Check phone number matches
    if (stored.phone !== phoneNumber) {
      console.log(
        `❌ Phone mismatch: stored=${stored.phone}, received=${phoneNumber}`,
      );
      return NextResponse.json(
        { error: "Numéro de téléphone incorrect" },
        { status: 400 },
      );
    }

    // Check if expired
    if (stored.expiresAt < new Date()) {
      otpStore.delete(userId);
      console.log("⏰ OTP expiré pour:", userId);
      return NextResponse.json(
        { error: "Code expiré. Demandez un nouveau code." },
        { status: 400 },
      );
    }

    // Check code
    if (stored.code !== code) {
      console.log(`❌ Code incorrect. Attendu: ${stored.code}, Reçu: ${code}`);
      return NextResponse.json({ error: "Code incorrect" }, { status: 400 });
    }

    // Supprimer le code utilisé
    otpStore.delete(userId);

    console.log("✅ OTP vérifié pour:", userId);

    // ✅ Sauvegarder dans Prisma
    try {
      await prisma.user.update({
        where: { clerkId: userId },
        data: {
          phoneNumber,
          isPhoneVerified: true, // Make sure this matches your schema
          phoneVerifiedAt: new Date(),
        },
      });
      console.log("✅ Phone verified sauvegardé en DB");
    } catch (prismaError: any) {
      console.error("⚠️ Erreur Prisma (non bloquant):", prismaError.message);
      // On continue même si Prisma échoue car l'OTP est vérifié
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
