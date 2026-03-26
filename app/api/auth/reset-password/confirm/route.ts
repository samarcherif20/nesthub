// app/api/auth/reset-password/confirm/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { email, token, password } = await req.json();
    
    if (!password) {
      return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
    }

    let clerkUserId: string | null = null;

    // Cas avec token (votre propre système)
    if (token) {
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
      });

      if (!resetToken) {
        return NextResponse.json({ error: "Token invalide" }, { status: 400 });
      }

      if (resetToken.usedAt) {
        return NextResponse.json({ error: "Token déjà utilisé" }, { status: 400 });
      }

      if (new Date() > resetToken.expiresAt) {
        return NextResponse.json({ error: "Token expiré" }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { email: resetToken.email },
        select: { clerkId: true }
      });

      if (!user || !user.clerkId) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }

      clerkUserId = user.clerkId;

      // Marquer le token comme utilisé
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
    }
    // Cas avec email (via Clerk directement)
    else if (email) {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: { clerkId: true }
      });

      if (!user || !user.clerkId) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }

      clerkUserId = user.clerkId;
    } else {
      return NextResponse.json({ error: "Email ou token requis" }, { status: 400 });
    }

    // Mettre à jour le mot de passe dans Clerk
    const clerk = await clerkClient();
    await clerk.users.updateUser(clerkUserId, {
      password,
    });

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("[POST /api/auth/reset-password/confirm] Erreur:", error);
    return NextResponse.json({ 
      error: "Une erreur est survenue. Veuillez réessayer plus tard." 
    }, { status: 500 });
  }
}