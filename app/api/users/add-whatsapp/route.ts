import { NextResponse } from "next/server";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);

// Stockage temporaire en mémoire
const otpStore = new Map<
  string,
  { code: string; phone: string; expiresAt: Date }
>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export { otpStore };

export async function POST(req: Request) {
  try {
    const { userId, phoneNumber } = await req.json();

    console.log("add-whatsapp appelé pour:", { userId, phoneNumber });

    if (!userId || !phoneNumber) {
      return NextResponse.json(
        { error: "userId et phoneNumber requis" },
        { status: 400 },
      );
    }

    if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Format invalide. Exemple : +21698123456" },
        { status: 400 },
      );
    }

    // ✅ ÉTAPE 1: Trouver l'utilisateur dans ta base avec son clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // ✅ ÉTAPE 2: Vérifier si l'utilisateur existe
    if (!user) {
      console.error("Utilisateur non trouvé pour clerkId:", userId);
      return NextResponse.json(
        {
          error:
            "Utilisateur non trouvé. Veuillez compléter votre inscription.",
        },
        { status: 404 },
      );
    }

    console.log("Utilisateur trouvé:", {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
    });

    // Générer le code OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Nettoyer les anciens OTP non utilisés
    await prisma.otpCode.deleteMany({
      where: {
        userId: user.id, // ⚠️ Utiliser user.id (UUID) pas clerkId
        used: false,
      },
    });

    // Sauvegarder en BDD avec le bon ID
    await prisma.otpCode.create({
      data: {
        userId: user.id, // ⚠️ Utiliser user.id (UUID)
        phoneNumber: phoneNumber,
        code: otpCode,
        expiresAt: expiresAt,
        used: false,
      },
    });

    // Stocker en mémoire (clé = clerkId pour faciliter la recherche plus tard)
    otpStore.set(userId, { code: otpCode, phone: phoneNumber, expiresAt });

    console.log("✅ OTP créé pour user:", user.id);
    console.log("📱 Code:", otpCode);
    console.log("⏰ Expire:", expiresAt);

    // Envoyer via WhatsApp
    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER!,
        to: `whatsapp:${phoneNumber}`,
        body: `🏠 *NESTHUB* - Votre code de vérification : *${otpCode}*\n\nCe code expire dans 30 minutes.\n\nSi vous n'avez pas demandé ce code, ignorez ce message.`,
      });
      console.log("✅ WhatsApp envoyé à:", phoneNumber);
    } catch (twilioError) {
      console.error("❌ Erreur Twilio:", twilioError);
      // En développement, on continue même si Twilio échoue
      console.log(`🔑 Code de test (Twilio failed): ${otpCode}`);
    }

    return NextResponse.json({
      success: true,
      message: "Code WhatsApp envoyé (valable 30 minutes)",
      testCode: process.env.NODE_ENV === "development" ? otpCode : undefined,
    });
  } catch (error: any) {
    console.error("❌ Erreur add-whatsapp:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
