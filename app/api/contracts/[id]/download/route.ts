// app/api/contracts/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    
    const contract = await prisma.contract.findUnique({
      where: { id: id },
      include: { 
        booking: {
          include: {
            tenant: true,
            owner: true,
          }
        } 
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrat non trouvé" }, { status: 404 });
    }

    // Vérifier les permissions
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    const isTenant = contract.booking.tenantId === user?.id;
    const isOwner = contract.booking.ownerId === user?.id;
    const isAdmin = user?.role === "ADMIN";

    if (!isTenant && !isOwner && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (!contract?.pdfUrl) {
      return NextResponse.json({ error: "PDF non trouvé" }, { status: 404 });
    }

    // Extraire le base64 de l'URL data
    const base64Match = contract.pdfUrl.match(/^data:application\/pdf;base64,(.+)$/);
    let binaryData: Buffer;
    
    if (base64Match) {
      binaryData = Buffer.from(base64Match[1], 'base64');
    } else {
      // Si c'est déjà du base64 pur
      binaryData = Buffer.from(contract.pdfUrl, 'base64');
    }

    return new NextResponse(binaryData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrat_${contract.reference}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur téléchargement PDF:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}