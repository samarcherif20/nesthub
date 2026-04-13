// app/api/owner/team/[memberId]/permissions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { userId: clerkId } = getAuth(req);
    const { memberId } = await params;
    const body = await req.json();
    const { canEdit, canManageBookings, canViewRevenue, canManageTeam } = body;

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

    const updatedMember = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        canEdit: canEdit !== undefined ? canEdit : member.canEdit,
        canManageBookings: canManageBookings !== undefined ? canManageBookings : member.canManageBookings,
        canViewRevenue: canViewRevenue !== undefined ? canViewRevenue : member.canViewRevenue,
        canManageTeam: canManageTeam !== undefined ? canManageTeam : member.canManageTeam,
      },
    });

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error) {
    console.error("[PATCH /api/owner/team/:memberId/permissions] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}