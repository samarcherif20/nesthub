import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    console.log(" Tentative d'annulation de la session:", sessionId);

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 },
      );
    }

    // Vérifier que la clé API existe
    if (!process.env.CLERK_SECRET_KEY) {
      console.error(" CLERK_SECRET_KEY manquante");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 },
      );
    }

    // Appeler l'API Clerk pour révoquer la session
    const response = await fetch(
      `https://api.clerk.com/v1/sessions/${sessionId}/revoke`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(" Erreur API Clerk:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      return NextResponse.json(
        { error: "Failed to revoke session" },
        { status: response.status },
      );
    }

    console.log(" Session annulée avec succès:", sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(" Erreur:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
