import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-orange-300 mb-4">403</h1>
        <p className="text-xl text-gray-600">Accès refusé</p>
        <p className="text-gray-500 mt-2">Vous navez pas lautorisation daccéder à cette ressource.</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 block">
          Retour à laccueil
        </Link>
      </div>
    </div>
  );
}