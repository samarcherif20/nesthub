"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-300 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Une erreur est survenue
        </h2>
        <p className="text-gray-600 mb-6">
          Nous sommes désolés, quelque chose sest mal passé.
        </p>
        <button
          onClick={reset}
          className="bg-slate-900 text-white px-6 py-3 rounded hover:bg-slate-800"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}