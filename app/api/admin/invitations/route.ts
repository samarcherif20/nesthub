// app/api/admin/invitations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { invitationEmailService } from "@/lib/services/invitation-email.service";
import { randomUUID } from "crypto";

// POST /api/admin/invitations — Créer et envoyer une invitation
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    // Vérifier que c'est un admin
    const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier si l'email est déjà admin
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser?.role === "ADMIN") {
      return NextResponse.json({ error: "Cet utilisateur est déjà administrateur" }, { status: 409 });
    }

    // Supprimer toute invitation existante pour cet email (pour renvoyer)
    await prisma.adminInvitation.deleteMany({ where: { email: normalizedEmail } });

    // Créer le token + expiration 48h
    const token     = randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = await prisma.adminInvitation.create({
      data: {
        email:     normalizedEmail,
        token,
        invitedBy: userId,
        expiresAt,
        role:      "ADMIN",
      },
    });

    // Construire le lien
    const baseUrl    = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/fr/accept-invite?token=${token}`;

    // Envoyer l'email
    const adminName = `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || "Un administrateur";
    await invitationEmailService.sendInvitation({
      toEmail:       normalizedEmail,
      invitedByName: adminName,
      invitedByEmail: admin.email,
      inviteLink,
      expiresAt,
    });

    return NextResponse.json({ success: true, invitation: { id: invitation.id, email: invitation.email, expiresAt } });
  } catch (error: any) {
    console.error("[POST /api/admin/invitations]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/admin/invitations — Liste des invitations
export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const invitations = await prisma.adminInvitation.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Enrichir avec le nom de l'invitant
    const inviterIds = [...new Set(invitations.map(i => i.invitedBy))];
    const inviters   = await prisma.user.findMany({
      where:  { clerkId: { in: inviterIds } },
      select: { clerkId: true, firstName: true, lastName: true, email: true },
    });
    const inviterMap = Object.fromEntries(inviters.map(u => [u.clerkId, u]));

    const enriched = invitations.map(inv => ({
      ...inv,
      invitedByUser: inviterMap[inv.invitedBy] || null,
      status: inv.acceptedAt
        ? "accepted"
        : new Date() > inv.expiresAt
        ? "expired"
        : "pending",
    }));

    return NextResponse.json({ invitations: enriched });
  } catch (error) {
    console.error("[GET /api/admin/invitations]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}