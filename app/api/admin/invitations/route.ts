// app/api/admin/invitations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { invitationEmailService } from "@/lib/services/invitation-email.service";
import { randomUUID } from "crypto";

// POST /api/admin/invitations — Créer et envoyer une invitation
export async function POST(req: NextRequest) {
  console.log("📨 POST /api/admin/invitations - Début");
  
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      console.log("❌ Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const admin = await prisma.user.findUnique({ 
      where: { clerkId: userId },
      select: { firstName: true, lastName: true, email: true, role: true }
    });
    
    if (!admin || admin.role !== "ADMIN") {
      console.log("❌ Accès refusé - rôle:", admin?.role);
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      console.log("❌ Email invalide:", email);
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("📧 Invitation pour:", normalizedEmail);

    // Vérifier si l'email est déjà admin
    const existingUser = await prisma.user.findUnique({ 
      where: { email: normalizedEmail },
      select: { role: true, email: true }
    });
    
    if (existingUser && existingUser.role === "ADMIN") {
      console.log("❌ Utilisateur déjà admin:", normalizedEmail);
      return NextResponse.json({ 
        error: "Cet utilisateur est déjà administrateur" 
      }, { status: 409 });
    }

    // Vérifier s'il existe déjà une invitation ACTIVE (non révoquée, non acceptée, non expirée)
    const existingActiveInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email: normalizedEmail,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingActiveInvitation) {
      console.log("⚠️ Invitation active existante pour:", normalizedEmail);
      return NextResponse.json({ 
        error: "Une invitation active existe déjà pour cet email",
        invitation: {
          id: existingActiveInvitation.id,
          expiresAt: existingActiveInvitation.expiresAt
        }
      }, { status: 409 });
    }

    // Vérifier s'il existe une invitation RÉVOQUÉE pour cet email
    const existingRevokedInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email: normalizedEmail,
        revokedAt: { not: null }
      }
    });

    let invitation;
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    console.log("🔑 Token créé:", token);
    console.log("⏰ Expire le:", expiresAt);

    if (existingRevokedInvitation) {
      // Mettre à jour l'invitation révoquée au lieu d'en créer une nouvelle
      console.log("🔄 Invitation révoquée trouvée, mise à jour:", existingRevokedInvitation.id);
      invitation = await prisma.adminInvitation.update({
        where: { id: existingRevokedInvitation.id },
        data: {
          token,
          expiresAt,
          revokedAt: null,
          acceptedAt: null,
        }
      });
      console.log("✅ Invitation révoquée mise à jour, ID:", invitation.id);
    } else {
      // Supprimer les anciennes invitations expirées
      await prisma.adminInvitation.deleteMany({ 
        where: { 
          email: normalizedEmail,
          expiresAt: { lt: new Date() },
          acceptedAt: null,
          revokedAt: null
        } 
      });
      console.log("🗑️ Anciennes invitations expirées supprimées");

      // Créer une nouvelle invitation
      invitation = await prisma.adminInvitation.create({
        data: {
          email: normalizedEmail,
          token,
          invitedBy: userId,
          expiresAt,
          role: "ADMIN",
        },
      });
      console.log("✅ Nouvelle invitation créée en DB, ID:", invitation.id);
    }

    // Construire le lien
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const inviteLink = `${baseUrl}/fr/accept-invite?token=${token}&type=admin`;
    console.log("🔗 Lien d'invitation:", inviteLink);

    // Envoyer l'email
    const adminName = `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || "Un administrateur";
    
    try {
      await invitationEmailService.sendInvitation({
        toEmail: normalizedEmail,
        invitedByName: adminName,
        invitedByEmail: admin.email,
        inviteLink,
        expiresAt,
      });
      console.log("📧 Email envoyé avec succès à:", normalizedEmail);
    } catch (emailError) {
      console.error("❌ Erreur lors de l'envoi de l'email:", emailError);
      return NextResponse.json({ 
        success: false, 
        error: "L'invitation a été créée mais l'envoi de l'email a échoué. Veuillez réessayer.",
        invitation: { id: invitation.id, email: invitation.email, expiresAt }
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      invitation: { 
        id: invitation.id, 
        email: invitation.email, 
        expiresAt 
      }
    });
    
  } catch (error: any) {
    console.error("[POST /api/admin/invitations] Erreur détaillée:", error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: "Erreur de contrainte unique"
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: "Erreur serveur: " + (error.message || "Veuillez réessayer plus tard") 
    }, { status: 500 });
  }
}

// GET /api/admin/invitations — Liste des invitations
export async function GET(req: NextRequest) {
  console.log("📋 GET /api/admin/invitations - Début");
  
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      console.log("❌ Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ 
      where: { clerkId: userId },
      select: { role: true }
    });
    
    if (!admin || admin.role !== "ADMIN") {
      console.log("❌ Accès refusé - rôle:", admin?.role);
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const invitations = await prisma.adminInvitation.findMany({
      orderBy: { createdAt: "desc" },
    });
    console.log(`📊 ${invitations.length} invitations trouvées`);

    const inviterIds = [...new Set(invitations.map(i => i.invitedBy))];
    const inviters = await prisma.user.findMany({
      where: { clerkId: { in: inviterIds } },
      select: { clerkId: true, firstName: true, lastName: true, email: true },
    });
    
    const inviterMap = Object.fromEntries(inviters.map(u => [u.clerkId, u]));

    const enriched = invitations.map(inv => {
      const now = new Date();
      
      let status = "pending";
      if (inv.revokedAt) {
        status = "revoked";
      } else if (inv.acceptedAt) {
        status = "accepted";
      } else if (now > inv.expiresAt) {
        status = "expired";
      }
      
      return {
        ...inv,
        invitedByUser: inviterMap[inv.invitedBy] || null,
        status,
        isExpired: status === "expired",
        isAccepted: status === "accepted",
        isRevoked: status === "revoked",
        daysRemaining: status === "pending" 
          ? Math.ceil((inv.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0
      };
    });

    return NextResponse.json({ 
      invitations: enriched,
      counts: {
        total: enriched.length,
        pending: enriched.filter(i => i.status === "pending").length,
        accepted: enriched.filter(i => i.status === "accepted").length,
        expired: enriched.filter(i => i.status === "expired").length,
        revoked: enriched.filter(i => i.status === "revoked").length
      }
    });
    
  } catch (error: any) {
    console.error("[GET /api/admin/invitations] Erreur:", error);
    return NextResponse.json({ 
      error: "Erreur serveur: " + (error.message || "Veuillez réessayer plus tard") 
    }, { status: 500 });
  }
}