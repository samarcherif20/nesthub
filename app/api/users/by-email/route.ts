// app/api/clerk/user-by-email/[email]/route.ts
import { NextResponse } from "next/server";

// Types Clerk
interface ClerkEmailAddress {
  email_address: string;
  id: string;
  verification: {
    status: string;
  };
}

interface ClerkUser {
  id: string;
  email_addresses: ClerkEmailAddress[];
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  public_metadata?: Record<string, unknown>;
}

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    const { email } = params;
    const decodedEmail = decodeURIComponent(email);
    
    // Vérifier que la clé API existe
    if (!process.env.CLERK_SECRET_KEY) {
      console.error("❌ CLERK_SECRET_KEY manquante");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 }
      );
    }

    // Appeler l'API Clerk
    const response = await fetch('https://api.clerk.com/v1/users?limit=100', {
      headers: {
        'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error("❌ Erreur API Clerk:", response.statusText);
      return NextResponse.json(
        { error: "Failed to fetch users from Clerk" },
        { status: response.status }
      );
    }

    const users: ClerkUser[] = await response.json();
    
    // Chercher l'utilisateur qui a cet email
    const user = users.find((u: ClerkUser) => 
      u.email_addresses.some((e: ClerkEmailAddress) => e.email_address === decodedEmail)
    );
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Clerk" },
        { status: 404 }
      );
    }

    // Retourner seulement l'ID
    return NextResponse.json({ 
      id: user.id,
      email: decodedEmail 
    });

  } catch (error) {
    console.error("❌ Erreur:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}