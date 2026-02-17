import createMiddleware from "next-intl/middleware";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: "fr",
  localePrefix: "always",
});

const isPublicRoute = createRouteMatcher([
  "/",
  "/:locale",
  "/:locale/login",
  "/:locale/register",
  "/:locale/cgu",
  "/:locale/faq",
  "/:locale/about",
  "/:locale/how-it-works",
  "/api/webhook/clerk",
]);

export default clerkMiddleware(async (auth, req) => {
  const intlResponse = intlMiddleware(req);
  if (intlResponse) return intlResponse;

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  if (!userId) {
    const locale = req.nextUrl.pathname.split("/")[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
