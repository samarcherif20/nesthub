// app/[locale]/page.tsx ✅ CORRIGÉ
"use client";

import Link from "next/link"; // ← next/link, PAS lucide-react
import { useLocale } from "next-intl";

export default function HomePage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">NestHub</h1>
        <p className="text-gray-600">Plateforme de location immobilière</p>
        <div className="mt-8 space-x-4">
          <Link
            href={`/${locale}/login`}
            className="bg-slate-900 text-white px-6 py-2 rounded"
          >
            Connexion
          </Link>
          <Link
            href={`/${locale}/register`}
            className="border border-slate-900 px-6 py-2 rounded"
          >
            Inscription
          </Link>
        </div>
      </div>
    </div>
  );
}