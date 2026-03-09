import createMiddleware from "next-intl/middleware";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale, isValidLocale } from "@/lib/i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "fr",
  localePrefix: "always",
});

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;

  // ========================================
  // API routes — AJOUT des routes publiques
  // ========================================
  if (pathname.startsWith("/api/")) {
    // ✅ Routes API qui ne nécessitent PAS d'authentification
    const publicApiRoutes = [
      "/api/clerk/webhook",
      "/api/clerk/users-by-email",
      "/api/clerk/end-session",
      "/api/users/by-email",
      "/api/users/by-clerk-id",
      "/api/users/by-username",
      "/api/auth/login",
      "/api/auth/register",

    ];

    // Vérifier si la route est publique
    const isPublicApiRoute = publicApiRoutes.some((route) =>
      pathname.startsWith(route),
    );

    if (isPublicApiRoute) {
      console.log("🔓 [API PUBLIQUE] Accès autorisé:", pathname);
      return NextResponse.next();
    }
    console.log("🔐 [API CHECK]", pathname);

    // Pour les autres routes API (comme /api/admin/users)
    console.log("🔐 [API PRIVEE] Vérification pour:", pathname);
    const { userId } = await auth();
    if (!userId) {
      console.log("❌ [API PRIVEE] Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.log("✅ [API PRIVEE] Authentifié, userId:", userId);
    return NextResponse.next();
  }

  // ========================================
  // TOUJOURS appliquer intl d'abord
  // ========================================
  const intlResponse = intlMiddleware(req);

  // Si redirect (ex: / → /fr), suivre immédiatement
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // ========================================
  // Déterminer locale et chemin
  // ========================================
  const pathParts = pathname.split("/").filter(Boolean);
  const locale =
    pathParts[0] && isValidLocale(pathParts[0]) ? pathParts[0] : defaultLocale;
  const pathWithoutLocale = "/" + pathParts.slice(1).join("/");

  // ========================================
  // Pages publiques
  // ========================================
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/cgu",
    "/faq",
    "/about",
    "/how-it-works",
    "/verify-email-code",
  ];

  if (publicPaths.includes(pathWithoutLocale)) {
    return intlResponse;
  }

  // ========================================
  // Routes protégées
  // ========================================
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }
  // ✅ Vérification spécifique pour les pages admin/verifications
  // Les pages commençant par /admin/verifications sont automatiquement protégées
  // car elles nécessitent déjà une authentification (userId)
  // Mais tu peux ajouter une vérification de rôle si nécessaire
  if (pathWithoutLocale.startsWith('/admin/verifications')) {
    // Ici tu pourrais vérifier le rôle si besoin
    console.log("🔐 Accès à la page verifications:", pathWithoutLocale);
  }

  return intlResponse;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/:path*",
  ],
};
