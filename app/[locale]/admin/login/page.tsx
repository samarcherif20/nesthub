// app/admin/login/page.tsx

import { SignIn } from "@clerk/nextjs";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function AdminLoginPage() {
  const t = await getTranslations("adminLogin");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-xl font-bold text-white">{t("title")}</h1>
            <p className="text-slate-300 text-sm mt-1">{t("subtitle")}</p>
          </div>

          {/* Formulaire Clerk */}
          <div className="p-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <span>ℹ️</span>
                {t("securityNotice")}
              </p>
            </div>

            <SignIn
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none p-0",
                  formButtonPrimary:
                    "bg-slate-900 hover:bg-slate-800 text-white w-full p-3 rounded-lg font-medium",
                  formFieldInput:
                    "w-full p-3 border border-gray-200 rounded-lg focus:border-slate-900 focus:outline-none",
                  formFieldLabel: "text-sm font-medium text-gray-700 mb-1 block",
                  footerActionLink: "text-slate-900 hover:underline",
                  identityPreviewEditButton: "text-slate-900",
                },
              }}
            />
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 text-center border-t">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-slate-900 transition-colors"
            >
              {t("backToSite")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}