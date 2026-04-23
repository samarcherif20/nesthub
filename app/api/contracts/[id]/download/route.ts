// app/api/contracts/[id]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const contract = await prisma.contract.findUnique({
      where: { id: id },
    });

    if (!contract?.pdfUrl) {
      return NextResponse.json({ error: "PDF non trouvé" }, { status: 404 });
    }

    // Extraire le base64 de l'URL data
    const base64Data = contract.pdfUrl.split(',')[1];
    const binaryData = Buffer.from(base64Data, 'base64');

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