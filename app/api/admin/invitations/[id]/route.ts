import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
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

    await prisma.adminInvitation.delete({ 
      where: { id: params.id } 
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("[DELETE /api/admin/invitations/:id]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}