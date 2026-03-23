// app/[locale]/sso-callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SSOCallbackPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      if (!isLoaded) return;

      try {
        // Si l'utilisateur est connecté via OAuth
        if (user) {
          console.log('👤 Utilisateur OAuth connecté:', user.id);

          // Récupérer l'utilisateur depuis notre DB pour connaître son rôle
          const response = await fetch(`/api/users/by-clerk-id/${user.id}`);
          
          if (response.ok) {
            const dbUser = await response.json();
            console.log('📦 Rôle utilisateur DB:', dbUser.role);

            // Rediriger selon le rôle (comme dans votre hook useAuth)
            if (dbUser.role === 'ADMIN') {
              router.push('../../../admin/dashboard');
            } else if (dbUser.role === 'PROPERTY_OWNER') {
              router.push('/dashboard/owner');
            } else {
              router.push('/dashboard/renter');
            }
          } else {
            console.log('❌ Utilisateur non trouvé dans la DB');
            // Si l'utilisateur n'existe pas dans la DB, rediriger vers login avec erreur
            router.push('/login?error=account_not_found');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification:', error);
        router.push('/login?error=oauth_error');
      }
    };

    checkUserAndRedirect();
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Connexion en cours, veuillez patienter...
        </p>
      </div>
    </div>
  );
}