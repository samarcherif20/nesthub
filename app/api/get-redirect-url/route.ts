// app/api/get-redirect-url/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const redirectUrl = cookieStore.get('redirectAfterLogin')?.value;
    
    console.log("🍪 Cookie redirectAfterLogin lu dans API:", redirectUrl);
    
    return NextResponse.json({ url: redirectUrl || null });
  } catch (error) {
    console.error("Erreur récupération cookie:", error);
    return NextResponse.json({ url: null });
  }
}