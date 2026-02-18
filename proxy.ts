import createMiddleware from "next-intl/middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n";
import { cookies } from "next/headers";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "fr",
  localePrefix: "always",
});

const ADMIN_URL_KEY = process.env.ADMIN_URL_KEY;
const COOKIE_NAME = "admin_activation";

// ROUTES PUBLIQUES (pas besoin d'auth)
const isPublicRoute = createRouteMatcher([
  "/:locale",
  "/:locale/login",
  "/:locale/register",
  "/:locale/cgu",
  "/:locale/faq",
  "/:locale/about",
  "/:locale/how-it-works",
  "/:locale/admin-gate",
  "/api/admin/verify",
  "/api/webhook/clerk",
]);

// MIDDLEWARE PRINCIPAL

export default clerkMiddleware(async (auth, req) => {
  const { pathname, searchParams } = req.nextUrl;
  const { userId } = await auth();

  // Extraire la locale du pathname
  const locale = pathname.split("/")[1] || defaultLocale;
  const cookieStore = await cookies();
  const intlResponse = intlMiddleware(req);
  if (intlResponse) {
    return intlResponse;
  }

  // PROTECTION ADMIN (/admin/*)

  if (pathname.startsWith("/admin")) {
    // Vérifier cookie d'activation
    const activationCookie = cookieStore.get(COOKIE_NAME);

    if (!activationCookie) {
      // Pas de cookie → rediriger vers portail d'activation
      const gateUrl = new URL(`/${locale}/admin-gate`, req.url);

      // Garder la clé si présente
      const key = searchParams.get("key");
      if (key) gateUrl.searchParams.set("key", key);

      return NextResponse.redirect(gateUrl);
    }

    // Cookie présent → laisser passer (vérification finale dans layout)
    return NextResponse.next();
  }

  // PORTAIL ADMIN-GATE

  if (pathname.includes("/admin-gate")) {
    const providedKey = searchParams.get("key");

    // Clé invalide ou manquante → 404 (ne révèle pas l'existence)
    if (providedKey !== ADMIN_URL_KEY) {
      return new Response("Not Found", { status: 404 });
    }

    // Clé valide → afficher le portail
    return NextResponse.next();
  }

  // ÉTAPE 4 : ROUTES PUBLIQUES

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // PROTECTION STANDARD (auth requise)

  if (!userId) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
