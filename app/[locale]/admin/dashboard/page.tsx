"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">
            Tableau de bord admin
          </h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-gray-700">
              Connecté en tant que : <span className="font-semibold">{user?.emailAddresses[0]?.emailAddress}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Rôle: admin
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}