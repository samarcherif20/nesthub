// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { passwordResetEmailService } from "@/lib/services/password-reset-email.service";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { 
        email: true, 
        firstName: true, 
        lastName: true,
        clerkId: true 
      }
    });

    if (!user) {
      // Sécurité : on ne révèle pas si l'email existe
      return NextResponse.json({ success: true });
    }

    // Supprimer les anciens tokens
    await prisma.passwordResetToken.deleteMany({
      where: {
        email: normalizedEmail,
        expiresAt: { lt: new Date() }
      }
    });

    // Créer un nouveau token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      }
    });

    // Construire le lien de réinitialisation (votre propre page)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/fr/reset-password?token=${token}`;

    // Envoyer l'email via Brevo
    await passwordResetEmailService.sendResetEmail({
      toEmail: normalizedEmail,
      resetLink,
      userName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined,
    });

    console.log(`[ResetPassword] Email envoyé à ${normalizedEmail}`);
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("[POST /api/auth/reset-password] Erreur:", error);
    return NextResponse.json({ 
      error: "Une erreur est survenue. Veuillez réessayer plus tard." 
    }, { status: 500 });
  }
}