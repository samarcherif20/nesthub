// app/api/admin/verify-code/route.ts

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE; // Code à 6 chiffres
const COOKIE_NAME = "admin_gate_unlocked";
const COOKIE_MAX_AGE = 60 * 30; // 30 minutes

export async function POST(req: Request) {
  const { code, key } = await req.json();
  
  // Vérifier la clé URL
  if (key !== process.env.ADMIN_URL_KEY) {
    return NextResponse.json(
      { error: "invalid_key" },
      { status: 403 }
    );
  }
  
  // Vérifier le code
  if (code !== ADMIN_ACCESS_CODE) {
    return NextResponse.json(
      { error: "invalid_code", remainingAttempts: 0 },
      { status: 401 }
    );
  }
  
  // Code correct → créer le cookie
  (await cookies()).set(COOKIE_NAME, "true", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  
  return NextResponse.json({
    success: true,
    redirectUrl: `/admin/login?key=${key}`,
  });
}