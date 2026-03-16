import { NextResponse } from "next/server";
import { otpStore } from "@/app/api/users/add-whatsapp/route";

export async function POST(req: Request) {
  try {
    const { userId, phoneNumber, code } = await req.json();

    if (!userId || !phoneNumber || !code) {
      return NextResponse.json(
        { error: "Tous les champs sont requis" },
        { status: 400 }
      );
    }

    // Vérifier le code en mémoire
    const stored = otpStore.get(userId);

    if (!stored) {
      return NextResponse.json(
        { error: "Code expiré. Demandez un nouveau code." },
        { status: 400 }
      );
    }

    if (stored.code !== code) {
      return NextResponse.json(
        { error: "Code incorrect" },
        { status: 400 }
      );
    }

    if (stored.expiresAt < new Date()) {
      otpStore.delete(userId);
      return NextResponse.json(
        { error: "Code expiré. Demandez un nouveau code." },
        { status: 400 }
      );
    }

    // Supprimer le code utilisé
    otpStore.delete(userId);

    console.log("✅ OTP vérifié pour:", userId);

    return NextResponse.json({
      success: true,
      message: "Numéro vérifié avec succès",
    });

  } catch (error: any) {
    console.error("❌ Erreur verify-whatsapp:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}