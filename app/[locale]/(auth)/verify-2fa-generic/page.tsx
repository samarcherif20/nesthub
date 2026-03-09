// app/verify-2fa-generic/page.tsx (pour plus tard)
"use client";

import { useRouter } from "next/navigation";

export default function Verify2FAGenericPage() {
  const router = useRouter();
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Fonctionnalité à venir</h1>
        <p className="mb-4">La vérification par TOTP/SMS sera bientôt disponible</p>
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retour au login
        </button>
      </div>
    </div>
  );
}