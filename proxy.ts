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
  const { userId } = await auth();

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
      "/api/cron/reactivate-users",
      "/api/get-redirect-url", // 👈 AJOUTÉ (pour récupérer l'URL de redirection)
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
  // GESTION DE LA REDIRECTION APRÈS LOGIN (AJOUTÉ)
  // ========================================
  
  // Si l'utilisateur est connecté
  if (userId) {
    // Vérifier s'il y a une URL de redirection stockée
    const redirectUrl = req.cookies.get('redirectAfterLogin')?.value;
    
    // Vérifier si la page actuelle est une page publique
    const publicPaths = [
      "/",
      "/login",
      "/register",
      "/cgu",
      "/faq",
      "/about",
      "/how-it-works",
      "/verify-email-code",
      "/terms",
      "/privacy"
    ];
    const isPublicPage = publicPaths.includes(pathWithoutLocale);
    
    // Si on a une URL de redirection et qu'on est sur une page publique
    if (isPublicPage && redirectUrl) {
      console.log("🔄 Redirection vers:", redirectUrl);
      const response = NextResponse.redirect(new URL(redirectUrl, req.url));
      response.cookies.delete('redirectAfterLogin');
      return response;
    }
  } else {
    // Si l'utilisateur n'est PAS connecté
    const publicPaths = [
      "/",
      "/login",
      "/register",
      "/cgu",
      "/faq",
      "/about",
      "/how-it-works",
      "/verify-email-code",
      "/terms",
      "/privacy"
    ];
    const isPublicPage = publicPaths.includes(pathWithoutLocale);
    const isStaticAsset = pathname.includes('/_next') || pathname.includes('/favicon.ico');
    
    // Ne pas rediriger pour les assets statiques
    if (!isPublicPage && !isStaticAsset && !pathname.startsWith('/api/')) {
      console.log("🔒 Page protégée, stockage de l'URL:", pathname);
      
      // Stocker l'URL demandée pour redirection après login
      const redirectUrl = pathWithoutLocale + req.nextUrl.search;
      const response = NextResponse.redirect(new URL(`/${locale}/login`, req.url));
      
      response.cookies.set('redirectAfterLogin', redirectUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      });
      
      return response;
    }
  }

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
    "/terms",
    "/privacy"
  ];

  if (publicPaths.includes(pathWithoutLocale)) {
    return intlResponse;
  }

  // ========================================
  // Routes protégées
  // ========================================
  if (!userId) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }
  
  // ✅ Vérification spécifique pour les pages admin/verifications
  if (pathWithoutLocale.startsWith('/admin/verifications')) {
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