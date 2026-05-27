// app/api/admin/invitations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ 
      where: { clerkId: userId } 
    });
    
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    //  MODIFIER: Marquer comme révoqué au lieu de supprimer
    await prisma.adminInvitation.update({ 
      where: { id: id },
      data: { revokedAt: new Date() }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("[DELETE /api/admin/invitations/:id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}