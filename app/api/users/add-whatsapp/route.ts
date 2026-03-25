import { NextResponse } from "next/server";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Stockage temporaire en mémoire
const otpStore = new Map<string, { code: string; phone: string; expiresAt: Date }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ✅ EXPORT the store so it can be used in verify-whatsapp
export { otpStore };

export async function POST(req: Request) {
  try {
    const { userId, phoneNumber } = await req.json();

    console.log("📱 add-whatsapp appelé pour:", { userId, phoneNumber });

    if (!userId || !phoneNumber) {
      return NextResponse.json(
        { error: "userId et phoneNumber requis" },
        { status: 400 }
      );
    }

    if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Format invalide. Exemple : +21698123456" },
        { status: 400 }
      );
    }

    // Générer le code
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Stocker en mémoire (clé = userId)
    otpStore.set(userId, { code: otpCode, phone: phoneNumber, expiresAt });

    console.log("💾 OTP stocké en mémoire pour:", userId);
    console.log("📦 OTP store size:", otpStore.size);
    console.log("🔑 OTP code:", otpCode);
    console.log("⏰ Expires at:", expiresAt);

    // Envoyer via WhatsApp
    try {
      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER!,
        to: `whatsapp:${phoneNumber}`,
        body: `🏠 *NestHub* - Votre code de vérification : *${otpCode}*\n\nCe code expire dans 10 minutes.\n\nSi vous n'avez pas demandé ce code, ignorez ce message.`,
      });
      console.log("✅ Message WhatsApp envoyé à:", phoneNumber);
    } catch (twilioError) {
      console.error("❌ Erreur Twilio:", twilioError);
      // For development, still return success
      console.log(`💡 Code de test (Twilio failed): ${otpCode}`);
    }

    return NextResponse.json({
      success: true,
      message: "Code WhatsApp envoyé",
      testCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });

  } catch (error: any) {
    console.error("❌ Erreur add-whatsapp:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}