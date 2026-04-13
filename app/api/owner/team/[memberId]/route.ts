// app/api/owner/team/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);
    const { memberId } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const owner = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!owner || (owner.role !== "PROPERTY_OWNER" && owner.role !== "ADMIN")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, listing: { ownerId: owner.id } },
    });

    if (!member) {
      return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
    }

    await prisma.teamMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/owner/team/:memberId] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
