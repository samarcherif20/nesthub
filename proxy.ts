import createMiddleware from "next-intl/middleware";
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale, isValidLocale } from "@/lib/i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "fr",
  localePrefix: "always",
});

const ADMIN_URL_KEY = process.env.ADMIN_URL_KEY;
const COOKIE_NAME = "admin_gate_unlocked";

export default clerkMiddleware(async (auth, req) => {
  const { pathname, searchParams } = req.nextUrl;

  // API routes — pas d'intl
  if (pathname.startsWith("/api/")) {
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
  const locale = pathParts[0] && isValidLocale(pathParts[0])
    ? pathParts[0]
    : defaultLocale;
  const pathWithoutLocale = "/" + pathParts.slice(1).join("/");

  // ========================================
  // Pages publiques
  // ========================================
  const publicPaths = ["/", "/login", "/register", "/cgu", "/faq", "/about", "/how-it-works"];
  if (publicPaths.includes(pathWithoutLocale)) {
    return intlResponse;
  }

  // ========================================
  // Admin gate
  // ========================================
  if (pathWithoutLocale === "/admin-gate") {
    const providedKey = searchParams.get("key");
    if (!providedKey) return NextResponse.rewrite(new URL(`/${locale}/404`, req.url));
    if (providedKey !== ADMIN_URL_KEY) return new Response("Forbidden", { status: 403 });

    const isUnlocked = req.cookies.get(COOKIE_NAME)?.value === "true";
    if (isUnlocked) {
      return NextResponse.redirect(
        new URL(`/${locale}/admin/login?key=${providedKey}`, req.url)
      );
    }
    return intlResponse;
  }

  // ========================================
  // Zone admin
  // ========================================
  if (pathWithoutLocale.startsWith("/admin")) {
    const isUnlocked = req.cookies.get(COOKIE_NAME)?.value === "true";
    if (!isUnlocked) {
      const gateUrl = new URL(`/${locale}/admin-gate`, req.url);
      const key = searchParams.get("key");
      if (key) gateUrl.searchParams.set("key", key);
      return NextResponse.redirect(gateUrl);
    }
    return intlResponse;
  }

  // ========================================
  // Routes protégées
  // ========================================
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  return intlResponse;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)" ],
};