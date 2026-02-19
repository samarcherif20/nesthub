import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600">Page non trouvée</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 block">
          Retour à laccueil{" "}
        </Link>
      </div>
    </div>
  );
}
