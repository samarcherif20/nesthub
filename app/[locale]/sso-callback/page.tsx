// app/[locale]/sso-callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SSOCallbackPage() {
  const { isLoaded: isSignInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();
  const { isLoaded: isUserLoaded, user } = useUser();
  const router = useRouter();
  const locale = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleSSOCallback = async () => {
      // Attendre que tous les hooks Clerk soient chargés
      if (!isSignInLoaded || !isSignUpLoaded || !isUserLoaded) {
        return;
      }

      try {
        console.log('🔄 Traitement du callback SSO...');
        console.log('SignIn loaded:', isSignInLoaded);
        console.log('SignUp loaded:', isSignUpLoaded);
        console.log('User loaded:', isUserLoaded);
        console.log('User exists:', !!user);

        // Vérifier d'abord si l'utilisateur est déjà connecté
        if (user) {
          console.log('✅ Utilisateur déjà authentifié:', user.id);
          
          // Récupérer le rôle depuis la base de données
          const response = await fetch(`/api/users/by-clerk-id/${user.id}`);
          
          if (response.ok) {
            const dbUser = await response.json();
            console.log('📦 Rôle utilisateur DB:', dbUser.role);

            // Rediriger selon le rôle
            if (dbUser.role === 'ADMIN') {
              router.push(`/${locale}/admin/dashboard`);
            } else if (dbUser.role === 'PROPERTY_OWNER') {
              router.push(`/${locale}/dashboard/owner`);
            } else {
              router.push(`/${locale}/dashboard/renter`);
            }
            return;
          } else {
            console.error('❌ Utilisateur non trouvé dans la DB');
            setError('Compte non trouvé. Veuillez vous inscrire d\'abord.');
            setTimeout(() => {
              router.push(`/${locale}/login?error=account_not_found`);
            }, 2000);
            return;
          }
        }

        // Vérifier s'il y a une tentative de vérification OAuth via les paramètres d'URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasRedirectParams = urlParams.has('__clerk_redirect') || 
                                  urlParams.has('__clerk_status') ||
                                  urlParams.has('oauth_callback');

        // Si nous sommes dans un callback OAuth, utiliser handleRedirectCallback
        if (signIn && hasRedirectParams) {
          console.log('🔄 Traitement du callback OAuth via handleRedirectCallback...');
          
          try {
            // Utiliser handleRedirectCallback au lieu de verifyWithRedirect
            const result = await signIn.handleRedirectCallback();
            
            console.log('Résultat handleRedirectCallback:', result.status);
            
            if (result.status === 'complete') {
              console.log('✅ Sign-in complet, activation session...');
              
              if (setActive && result.createdSessionId) {
                await setActive({ session: result.createdSessionId });
              }
              
              // Attendre un peu pour que la session soit établie
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Récupérer l'utilisateur courant
              const currentUser = result.user;
              
              if (currentUser?.id) {
                const response = await fetch(`/api/users/by-clerk-id/${currentUser.id}`);
                
                if (response.ok) {
                  const dbUser = await response.json();
                  console.log('📦 Rôle utilisateur DB:', dbUser.role);
                  
                  if (dbUser.role === 'ADMIN') {
                    router.push(`/${locale}/admin/dashboard`);
                  } else if (dbUser.role === 'PROPERTY_OWNER') {
                    router.push(`/${locale}/dashboard/owner`);
                  } else {
                    router.push(`/${locale}/dashboard/renter`);
                  }
                } else {
                  // Utilisateur OAuth qui n'existe pas encore dans notre DB
                  console.log('🆕 Nouvel utilisateur OAuth, redirection vers complétion profil');
                  router.push(`/${locale}/complete-profile?oauth=true&email=${encodeURIComponent(currentUser.primaryEmailAddress?.emailAddress || '')}`);
                }
              } else {
                router.push(`/${locale}/complete-profile?oauth=true`);
              }
            } else if (result.status === 'needs_second_factor') {
              console.log('🔐 2FA requis, redirection...');
              router.push(`/${locale}/verify-email-code`);
            } else {
              console.error('❌ Statut inattendu:', result.status);
              router.push(`/${locale}/login?error=sso_failed`);
            }
          } catch (verifyError) {
            console.error('Erreur lors du traitement du callback:', verifyError);
            router.push(`/${locale}/login?error=verification_failed`);
          }
        }
        // Pour sign-up
        else if (signUp && hasRedirectParams) {
          console.log('🔄 Traitement du callback OAuth sign-up...');
          
          try {
            const result = await signUp.handleRedirectCallback();
            
            console.log('Résultat handleRedirectCallback sign-up:', result.status);
            
            if (result.status === 'complete') {
              console.log('✅ Sign-up complet, redirection vers complétion profil...');
              router.push(`/${locale}/complete-profile?oauth=true`);
            } else {
              console.error('❌ Statut inattendu:', result.status);
              router.push(`/${locale}/login?error=sso_failed`);
            }
          } catch (verifyError) {
            console.error('Erreur lors du traitement du callback sign-up:', verifyError);
            router.push(`/${locale}/login?error=verification_failed`);
          }
        } else {
          console.log('⚠️ Pas de callback OAuth détecté, vérification standard...');
          
          // Vérifier s'il y a un utilisateur via l'API
          try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
              const data = await response.json();
              if (data.user) {
                console.log('✅ Utilisateur trouvé via API:', data.user.id);
                
                if (data.user.role === 'ADMIN') {
                  router.push(`/${locale}/admin/dashboard`);
                } else if (data.user.role === 'PROPERTY_OWNER') {
                  router.push(`/${locale}/dashboard/owner`);
                } else {
                  router.push(`/${locale}/dashboard/renter`);
                }
                return;
              }
            }
          } catch (apiError) {
            console.error('Erreur API:', apiError);
          }
          
          // Rediriger vers login si rien n'a fonctionné
          router.push(`/${locale}/login?error=no_oauth_flow`);
        }
      } catch (error) {
        console.error('❌ Erreur lors du callback SSO:', error);
        setError('Erreur lors de la connexion. Veuillez réessayer.');
        setTimeout(() => {
          router.push(`/${locale}/login?error=sso_error`);
        }, 2000);
      } finally {
        setProcessing(false);
      }
    };

    handleSSOCallback();
  }, [isSignInLoaded, isSignUpLoaded, isUserLoaded, signIn, signUp, user, setActive, router, locale]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          <p className="mt-2 text-xs text-gray-500">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Connexion en cours, veuillez patienter...
          </p>
        </div>
      </div>
    );
  }

  return null;
}