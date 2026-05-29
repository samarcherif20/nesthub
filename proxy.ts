import createMiddleware from "next-intl/middleware";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale, isValidLocale } from "@/lib/i18n";
function addNoCacheHeaders(response: NextResponse) {
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "fr",
  localePrefix: "always",
});

// Fonction pour obtenir la locale depuis la requête
function getLocaleFromRequest(req: any): string {
  const pathname = req.nextUrl.pathname;
  const pathSegments = pathname.split("/").filter(Boolean);
  if (pathSegments[0] && isValidLocale(pathSegments[0])) {
    return pathSegments[0];
  }
  const cookieLang = req.cookies.get("preferred-language")?.value;
  if (cookieLang && isValidLocale(cookieLang)) {
    return cookieLang;
  }
  return defaultLocale;
}

export default clerkMiddleware(async (auth, req) => {
  const { pathname } = req.nextUrl;
  const locale = getLocaleFromRequest(req);

  //  Redirection de /sign-in vers /{locale}/login
  if (pathname === "/sign-in" || pathname.startsWith("/sign-in?")) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  //  Redirection de /login sans locale vers /{locale}/login
  if (pathname === "/login" || pathname.startsWith("/login?")) {
    if (!pathname.includes(`/${locale}/login`)) {
      return NextResponse.redirect(
        new URL(`/${locale}/login${req.nextUrl.search}`, req.url),
      );
    }
    return NextResponse.next();
  }

  const { userId, sessionClaims, getToken } = await auth();

  //  Récupérer le token avec le template personnalisé
  const token = await getToken({ template: "my-app-template" });

  // Décoder le token pour extraire le rôle
  let roleFromToken = null;
  if (token) {
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      roleFromToken = decoded.role;
      console.log(" Rôle depuis le token JWT:", roleFromToken);
    } catch (e) {
      console.error("Erreur décodage token:", e);
    }
  }

  //  ADDED — bypass everything for verify-catch
  if (pathname.includes("/inscription/verify-catch")) {
    return intlMiddleware(req);
  }
  //  LANGUAGE PERSISTENCE - HANDLE REDIRECTS
  // Extract pathname without query parameters
  const currentPathname = req.nextUrl.pathname;

  // Check if the path already has a locale
  const pathSegments = currentPathname.split("/").filter(Boolean);
  const hasLocaleInPath = pathSegments[0] && isValidLocale(pathSegments[0]);

  // For paths that already have a locale, just update the cookie and continue
  // DON'T return early - let the normal flow continue
  if (hasLocaleInPath) {
    const currentLocale = pathSegments[0];
    const response = NextResponse.next();
    response.cookies.set("preferred-language", currentLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    // IMPORTANT: Don't return here! Just set the cookie and let the request continue
    // We'll apply this response later
  }

  // For paths WITHOUT locale, check if we need to redirect
  // But ONLY for specific paths that should have a locale
  if (
    !hasLocaleInPath &&
    !currentPathname.startsWith("/api/") &&
    !currentPathname.includes("/_next") &&
    !currentPathname.includes("/favicon.ico") &&
    !currentPathname.includes("/flags/")
  ) {
    const storedLang = req.cookies.get("preferred-language")?.value;

    // Only redirect if we have a stored language AND the path is not already the root with locale
    if (storedLang && isValidLocale(storedLang)) {
      // Don't redirect if it's the root path without locale - let intlMiddleware handle it
      if (currentPathname !== "/") {
        const newPath = `/${storedLang}${currentPathname}`;
        console.log(` Redirecting to preferred language: ${newPath}`);
        return NextResponse.redirect(new URL(newPath, req.url));
      }
    }
  }
  // END OF LANGUAGE PERSISTENCE
  if (pathname.startsWith("/api/")) {
    const publicApiRoutes = [
      "/api/contact",
      "/api/users/avatar", 
      "/api/users/increment-login-attempts",
      "/api/users/reset-login-attempts",
      "/api/users/update-last-login",
      "/api/complete-profile",
      "/api/mobile-upload/upload",
      "/api/mobile-upload/session",
      "/api/clerk/webhook/clerk",
      "/api/clerk/users-by-email",
      "/api/clerk/end-session",
      "/api/users/by-email",
      "/api/users/by-clerk-id",
      "/api/users/by-username",
      "/api/users/verify-email",
      "/api/users/create",
      "/api/users/update",
      "/api/users/verify-whatsapp",
      "/api/users/add-whatsapp",
      "/api/users/upload-photo",
      "/api/users/complete-profil",
      "/api/auth/create-clerk-user",
      "/api/users/update-clerk-id",
      "/api/auth/login",
      "/api/auth/register",
      "/api/cron/reactivate-users",
      "/api/cron/expire-info-requests",
      "/api/cron/expire-offers",
      "/api/cron/release-expired-bookings",
      "/api/cron/check-completed-bookings",
      "/api/cron/test-all",
      "/api/get-redirect-url",
      "/api/auth/reset-password",
      "/api/cohost/invitations/accept",
      "/api/admin/invitations/accept",
      "/api/notifications",
      "/api/notifications/test",
      "/api/stripe/webhook",
      "/api/webhook/stripe",
      "/api/payments/webhook",
    ];

    const isPublicApiRoute = publicApiRoutes.some((route) =>
      pathname.startsWith(route),
    );

    if (isPublicApiRoute) {
      console.log(" [API PUBLIQUE] Accès autorisé:", pathname);
      return NextResponse.next();
    }
    console.log(" [API CHECK]", pathname);

    console.log(" [API PRIVEE] Vérification pour:", pathname);
    if (!userId) {
      console.log(" [API PRIVEE] Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.log(" [API PRIVEE] Authentifié, userId:", userId);
    return NextResponse.next();
  }

  // TOUJOURS appliquer intl d'abord
  const intlResponse = intlMiddleware(req);

  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // Déterminer locale et chemin
  const pathParts = pathname.split("/").filter(Boolean);
  const localeFromPath =
    pathParts[0] && isValidLocale(pathParts[0]) ? pathParts[0] : defaultLocale;
  const pathWithoutLocale = "/" + pathParts.slice(1).join("/");

  // GESTION DE LA REDIRECTION APRÈS LOGIN
  if (userId) {
    const redirectUrl = req.cookies.get("redirectAfterLogin")?.value;

    const publicPaths = [
      "/choose-role",

      "/test-mobile-upload",
      "/",
      "/test",
      "/login",
      "/inscription/verify",
      "/inscription/verify-catch",
      "/inscription",
      "/complete-profile",
      "/cgu",
      "/faq",
      "/about",
      "/how-it-works",
      "/verify-email-code",
      "/terms",
      "/privacy",
      "/sso-callback",
      "/forgot-password",
      "/reset-password",
      "/listings/[id]",
    ];

    const isPublic =
      publicPaths.includes(pathWithoutLocale) ||
      pathWithoutLocale.startsWith("/mobile-upload");

    if (
      isPublic &&
      redirectUrl &&
      !pathWithoutLocale.includes("verify-catch")
    ) {
      console.log(" Redirection vers:", redirectUrl);
      const response = NextResponse.redirect(new URL(redirectUrl, req.url));
      response.cookies.delete("redirectAfterLogin");
      return response;
    }
  } else {
    const publicPaths = [
      "/choose-role",

      "/test-mobile-upload",
      "/",
      "/test",
      "/login",
      "/accept-invite",
      "/inscription/verify",
      "/inscription/verify-catch",
      "/inscription",
      "/complete-profile",
      "/cgu",
      "/faq",
      "/about",
      "/how-it-works",
      "/verify-email-code",
      "/terms",
      "/privacy",
      "/sso-callback",
      "/forgot-password",
      "/reset-password",
    ];

    const isPublic =
      publicPaths.includes(pathWithoutLocale) ||
      pathWithoutLocale.startsWith("/mobile-upload");

    const isStaticAsset =
      pathname.includes("/_next") || pathname.includes("/favicon.ico");

    if (!isPublic && !isStaticAsset && !pathname.startsWith("/api/")) {
      console.log(" Page protégée, stockage de l'URL:", pathname);

      const redirectUrl = pathWithoutLocale + req.nextUrl.search;
      const response = NextResponse.redirect(
        new URL(`/${localeFromPath}/login`, req.url),
      );

      response.cookies.set("redirectAfterLogin", redirectUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
      });

      return response;
    }
  }

  // Zone admin — protégée avec vérification du rôle ADMIN
  if (pathWithoutLocale.startsWith("/admin")) {
    console.log(" Accès admin tenté pour:", pathWithoutLocale);
    console.log(" userId:", userId);

    //  Utiliser le rôle du token JWT d'abord
    const userRole = roleFromToken;
    console.log(" Rôle depuis token JWT:", userRole);

    if (!userId) {
      console.log(" Pas d'userId, redirection vers login");
      const redirectUrl = pathWithoutLocale + req.nextUrl.search;
      const response = NextResponse.redirect(
        new URL(`/${localeFromPath}/login`, req.url),
      );

      response.cookies.set("redirectAfterLogin", redirectUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 10,
        path: "/",
      });

      return response;
    }

    //  Récupérer le rôle depuis la base de données (fallback si token n'a pas le rôle)
    let role = userRole;

    if (!role) {
      try {
        const { prisma } = await import("@/lib/prisma");

        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { role: true },
        });

        role = user?.role;
        console.log(" Rôle récupéré depuis DB (fallback):", role);
      } catch (error) {
        console.error(" Erreur récupération rôle depuis DB:", error);
        return NextResponse.redirect(new URL(`/${localeFromPath}/`, req.url));
      }
    }

    if (role !== "ADMIN") {
      console.log(" Accès admin refusé - rôle:", role);
      return NextResponse.redirect(new URL(`/${localeFromPath}/`, req.url));
    }

    console.log(" Accès admin autorisé pour:", userId);
    return intlResponse;
  }

  // Pages publiques
  const publicPaths = [
    "/complete-profile",
    "/choose-role",
    "/test-mobile-upload",
    "/",
    "/test",
    "/login",
    "/accept-invite",
    "/inscription/verify",
    "/complete-profile",
    "/inscription",
    "/inscription/verify-catch",
    "/cgu",
    "/faq",
    "/about",
    "/how-it-works",
    "/verify-email-code",
    "/terms",
    "/privacy",
    "/sso-callback",
    "/forgot-password",
    "/reset-password",
  ];

  const isPublic =
    publicPaths.includes(pathWithoutLocale) ||
    pathWithoutLocale.startsWith("/mobile-upload");

  if (isPublic) {
    return intlResponse;
  }

  // Routes protégées
  if (!userId) {
    return NextResponse.redirect(new URL(`/${localeFromPath}/login`, req.url));
  }

  if (pathWithoutLocale.startsWith("/admin/verifications")) {
    console.log(" Accès à la page verifications:", pathWithoutLocale);
  }

  return addNoCacheHeaders(intlResponse);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    "/api/:path*",
  ],
};
