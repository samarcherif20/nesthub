"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { useTranslations, useLocale } from "next-intl";
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Key,
  Fingerprint,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

// Color palette from Couleurs.txt
const COLORS = {
  electricBlue: "#1E5BFF",
  cyanLight: "#4CC9F0",
  mediumBlue: "#2F7BFF",
  purpleBlue: "#5A4BFF",
  deepPurple: "#3E2FBF",
  pureWhite: "#FFFFFF",
  circleBlue: "#2A56D6"
};

export default function AdminLoginPage() {
  const t = useTranslations("adminLogin");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  
  const { isLoaded, signIn, setActive } = useSignIn();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn || !setActive) {
      toast.error("Erreur", {
        description: "Service d'authentification non disponible",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        
        toast.custom(
          () => (
            <div className="flex items-start gap-3 p-4 bg-white border-l-4 rounded-lg shadow-lg w-96 animate-in slide-in-from-right fade-in duration-300"
                 style={{ borderLeftColor: COLORS.electricBlue }}>
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Connexion réussie</h4>
                <p className="text-xs text-gray-500">Redirection vers le tableau de bord...</p>
              </div>
            </div>
          ),
          { duration: 2000 }
        );
        
        setTimeout(() => {
          router.push(`/${locale}/admin/dashboard`);
        }, 1500);
      }
    } catch (err) {
      toast.custom(
        () => (
          <div className="flex items-start gap-3 p-4 bg-white border-l-4 rounded-lg shadow-lg w-96 animate-in slide-in-from-right fade-in duration-300"
               style={{ borderLeftColor: '#EF4444' }}>
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Erreur de connexion</h4>
              <p className="text-xs text-gray-500">Email ou mot de passe incorrect</p>
            </div>
          </div>
        ),
        { duration: 3000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 rounded-full blur-xl animate-pulse" 
                 style={{ background: COLORS.electricBlue }} />
            <div className="relative w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center"
                 style={{ boxShadow: `0 10px 25px -5px ${COLORS.electricBlue}40` }}>
              <Shield className="w-10 h-10" style={{ color: COLORS.electricBlue }} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
          <p className="text-gray-500">Connectez-vous à votre espace administrateur</p>
          
          {/* Clé d'accès (si présente) */}
          {key && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
              <Key className="w-4 h-4" style={{ color: COLORS.cyanLight }} />
              <span className="text-xs font-mono text-gray-600">
                Clé d'accès: {key.slice(0, 4)}-{key.slice(4, 8)}-{key.slice(8, 12)}-{key.slice(12, 16)}
              </span>
            </div>
          )}
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100"
             style={{ boxShadow: `0 20px 40px -15px ${COLORS.electricBlue}20` }}>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
                      style={{ color: focusedField === 'email' ? COLORS.electricBlue : '#9CA3AF' }} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: focusedField === 'email' ? COLORS.electricBlue : '#D1D5DB',
                    boxShadow: focusedField === 'email' ? `0 0 0 2px ${COLORS.electricBlue}20` : 'none'
                  }}
                  placeholder="admin@exemple.com"
                  required
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                      style={{ color: focusedField === 'password' ? COLORS.electricBlue : '#9CA3AF' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: focusedField === 'password' ? COLORS.electricBlue : '#D1D5DB',
                    boxShadow: focusedField === 'password' ? `0 0 0 2px ${COLORS.electricBlue}20` : 'none'
                  }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Options supplémentaires */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                  style={{ 
                    color: COLORS.electricBlue,
                    focusRingColor: COLORS.electricBlue
                  }}
                />
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
              <a 
                href="#" 
                className="text-sm font-medium hover:underline"
                style={{ color: COLORS.electricBlue }}
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Réinitialisation", {
                    description: "Contactez votre administrateur pour réinitialiser votre mot de passe"
                  });
                }}
              >
                Mot de passe oublié?
              </a>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              style={{ 
                background: `linear-gradient(135deg, ${COLORS.electricBlue}, ${COLORS.purpleBlue})`,
                boxShadow: `0 4px 15px ${COLORS.electricBlue}40`
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5" />
                  Se connecter
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Pied de page */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              &copy; 2024 NESTHUB. Tous droits réservés.
            </p>
          </div>
        </div>

        {/* Badge de sécurité */}
        <div className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 text-xs text-gray-400">
            <Shield className="w-3 h-3" style={{ color: COLORS.cyanLight }} />
            Connexion sécurisée • AES-256
          </span>
        </div>
      </div>
    </div>
  );
}