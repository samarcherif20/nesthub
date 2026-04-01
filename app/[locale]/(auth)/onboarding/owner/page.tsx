// app/(auth)/onboarding/owner/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function OwnerOnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const checkUserStatus = async () => {
      try {
        const res = await fetch('/api/user/role');
        const data = await res.json();
        
        // Si l'utilisateur a déjà des annonces, rediriger vers dashboard
        if (data.hasListings) {
          router.push('/owner/dashboard');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setChecking(false);
      }
    };

    checkUserStatus();
  }, [isLoaded, router]);

  if (!isLoaded || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue sur NestHub, {user?.username || user?.firstName}!
          </h1>
          <p className="mt-2 text-gray-600">
            Commençons par créer votre première annonce. C'est rapide et gratuit.
          </p>
        </div>

        {/* Formulaire de création */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          
        </div>
      </div>
    </div>
  );
}