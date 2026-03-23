// app/[locale]/accept-invite/page.tsx (version équilibrée)
'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import {  User, Loader2, LogIn } from "lucide-react";
import { TfiEmail } from "react-icons/tfi";
import { GrUserAdmin } from "react-icons/gr";
import { RiMailOpenLine } from "react-icons/ri";
import { MdMarkEmailRead } from "react-icons/md";

import { MdOutlineDangerous, MdOutlineVerified } from "react-icons/md";

import { 
  RiShieldKeyholeLine, 
  RiShieldCheckLine, 
  RiAdminLine, 
  RiEyeLine, 
  RiEyeOffLine,
  RiUserLine,
  RiMailLine,
  RiLockLine,
  RiArrowRightLine,
  RiTimeLine,
  RiErrorWarningLine,
  RiCheckboxCircleLine,
  RiCloseLine,
 
  RiShieldUserLine
} from "react-icons/ri";

// Composants
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";

// Hook personnalisé
import { useAcceptInvite } from "./hooks/useAcceptInvite";
import { ValidationPatterns, maskEmail, logger } from "@/lib/utils";

interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  general?: string;
}

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const locale = useLocale();

  // États du formulaire
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // États de validation
  const [touched, setTouched] = useState({
    firstName: false,
    lastName: false,
    username: false,
    password: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  
  // États pour les alertes
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  
  // États pour le montage
  const [mounted, setMounted] = useState(false);

  // Hook personnalisé
  const {
    info,
    checking,
    loading,
    success,
    error,
    setError,
    checkInvitation,
    acceptInvite,
    acceptExisting,
    requestNewLink,
  } = useAcceptInvite();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Vérifier l'invitation au chargement
  useEffect(() => {
    if (token) {
      checkInvitation(token);
    }
  }, [token]);

  // Gérer les erreurs
  useEffect(() => {
    if (error) {
      setAlertMessage(error);
      setShowErrorAlert(true);
    }
  }, [error]);

  // Gérer le succès
  useEffect(() => {
    if (success) {
      setAlertMessage("Invitation acceptée avec succès ! Redirection...");
      setShowSuccessAlert(true);
    }
  }, [success]);

  // Validation des champs avec ValidationPatterns
  const validateField = (field: string, value: string): string => {
    switch(field) {
      case "firstName":
        if (!value.trim()) return "Le prénom est requis";
        if (value.trim().length < 2) return "Le prénom doit contenir au moins 2 caractères";
        return "";
      case "lastName":
        if (!value.trim()) return "Le nom est requis";
        if (value.trim().length < 2) return "Le nom doit contenir au moins 2 caractères";
        return "";
      case "username":
        if (!value.trim()) return "Le nom d'utilisateur est requis";
        if (!ValidationPatterns.isUsername(value)) return "Le nom d'utilisateur doit contenir 3-20 caractères (lettres, chiffres, _)";
        return "";
      case "password":
        if (!value) return "Le mot de passe est requis";
        if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
        if (!/[A-Z]/.test(value)) return "Le mot de passe doit contenir au moins une majuscule";
        if (!/[a-z]/.test(value)) return "Le mot de passe doit contenir au moins une minuscule";
        if (!/[0-9]/.test(value)) return "Le mot de passe doit contenir au moins un chiffre";
        return "";
      default:
        return "";
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    let value = "";
    switch(field) {
      case "firstName": value = firstName; break;
      case "lastName": value = lastName; break;
      case "username": value = username; break;
      case "password": value = password; break;
    }
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: string, value: string) => {
    switch(field) {
      case "firstName": setFirstName(value); break;
      case "lastName": setLastName(value); break;
      case "username": setUsername(value); break;
      case "password": setPassword(value); break;
    }
    
    setShowErrorAlert(false);
    setError(null);
    
    if (touched[field as keyof typeof touched]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      firstName: validateField("firstName", firstName),
      lastName: validateField("lastName", lastName),
      username: validateField("username", username),
      password: validateField("password", password),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ firstName: true, lastName: true, username: true, password: true });
    
    if (!validateForm() || !token) {
      return;
    }

    logger.auth("Soumission formulaire acceptation", { firstName, lastName, username });
    await acceptInvite({
      token,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      password,
    });
  };

  const handleAcceptExisting = async () => {
    if (!token) return;
    await acceptExisting(token);
  };

  const handleRequestNewLink = () => {
    requestNewLink(info?.email);
  };

  if (!mounted) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        <div className="w-full flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      </div>
    );
  }

  // État CHARGEMENT
  if (checking) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        <div className="w-full flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              
              Vérification de votre invitation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si pas de token
  if (!token) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Alert Container */}
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
          {showErrorAlert && (
            <Alert
              type="error"
              message={alertMessage}
              onClose={() => setShowErrorAlert(false)}
              autoClose={5000}
            />
          )}
        </div>

        <div className="w-full flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="relative mb-8 inline-block">
              <div className="absolute inset-0 bg-red-400/15 blur-3xl rounded-full scale-[2]" />
              <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/60 flex items-center justify-center shadow-xl mx-auto">
                <RiErrorWarningLine className="text-4xl text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Lien invalide
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Aucun token d'invitation fourni.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-400 text-black font-bold rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 transition-all"
            >
              <RiArrowRightLine />
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // État INVALIDE / EXPIRE
  if (!info?.valid) {
    const isUsed = info?.reason === "already_used";
    const isExpired = info?.reason === "expired" || isUsed;
    
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Alert Container */}
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
          {showErrorAlert && (
            <Alert
              type="error"
              message={alertMessage}
              onClose={() => setShowErrorAlert(false)}
              autoClose={5000}
            />
          )}
        </div>

        <div className="w-full flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="relative mb-8 inline-block">
              <div className="absolute inset-0 bg-red-400/15 blur-3xl rounded-full scale-[2]" />
              <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800/60 flex items-center justify-center shadow-xl mx-auto">
                {isExpired ? (
                  <RiTimeLine className="text-4xl text-amber-500" />
                ) : (
                  <RiCloseLine className="text-4xl text-red-500" />
                )}
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isUsed ? "Invitation déjà utilisée" : isExpired ? "Lien expiré" : "Lien invalide"}
            </h1>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {isUsed
                ? "Cette invitation a déjà été acceptée. Connectez-vous normalement."
                : isExpired
                ? "Les liens d'invitation sont valides 48h. Celui-ci a expiré."
                : "Ce lien d'invitation est invalide ou introuvable."}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!isUsed && (
                <button
                  onClick={handleRequestNewLink}
                  className="px-6 py-2.5 bg-blue-400 text-black font-bold rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                  <RiMailLine />
                  Nouveau lien
                </button>
              )}
              <Link
                href="/login"
                className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {isUsed ? "Se connecter" : "Retour à l'accueil"}
              </Link>
            </div>

            <p className="mt-8 text-xs text-gray-400">
              Besoin d'aide ? Contactez votre administrateur.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // État SUCCES
  if (success) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Alert Container */}
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
          {showSuccessAlert && (
            <Alert
              type="success"
              message={alertMessage}
              onClose={() => setShowSuccessAlert(false)}
              autoClose={5000}
            />
          )}
        </div>

        <div className="w-full flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="relative mb-8 inline-block">
              <div className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full scale-[2] animate-pulse" />
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl mx-auto">
                <RiShieldKeyholeLine className="text-white text-3xl" />
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 mb-4">
              <RiCheckboxCircleLine className="text-sm" />
              {info.hasExistingAccount ? "Droits admin ajoutés" : "Compte créé"}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {info.hasExistingAccount ? "Félicitations ! 🎉" : "Bienvenue dans l'équipe ! 🎉"}
            </h1>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {info.hasExistingAccount ? (
                <>Votre compte <span className="font-semibold text-gray-900 dark:text-white">{maskEmail(info.email || "")}</span> a maintenant les droits administrateur.</>
              ) : (
                <>Votre compte administrateur <span className="font-semibold text-gray-900 dark:text-white">{maskEmail(info.email || "")}</span> est prêt.</>
              )}
            </p>

            <p className="text-xs text-gray-400 mb-6 flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-4 w-4" />
              Redirection vers le tableau de bord...
            </p>

            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-400 text-black font-bold rounded-xl hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 transition-all"
            >
              <RiAdminLine className="text-base" />
              Accéder au panel admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // État COMPTE EXISTANT
  if (info.hasExistingAccount) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
        {/* Alert Container */}
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
          {showErrorAlert && (
            <Alert
              type="error"
              message={alertMessage}
              onClose={() => setShowErrorAlert(false)}
              autoClose={5000}
            />
          )}
          {showSuccessAlert && (
            <Alert
              type="success"
              message={alertMessage}
              onClose={() => setShowSuccessAlert(false)}
              autoClose={5000}
            />
          )}
        </div>

        <div className="w-full flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 shadow-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600" />
              
              <div className="p-8">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800 mb-4">
                  <TfiEmail className="text-xs" /> Invitation reçue
                </div>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Compte existant détecté
                </h1>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Email : <span className="font-semibold text-indigo-600 dark:text-indigo-400">{info.email}</span>
                </p>

                <div className="mb-6 p-4 bg-indigo-50/50 dark:bg-indigo-900/15 rounded-xl border border-indigo-100 dark:border-indigo-800/40">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vous avez déjà un compte. Acceptez l'invitation pour obtenir les droits administrateur.
                  </p>
                </div>

                {info.invitedBy && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-900/15 border border-indigo-100 dark:border-indigo-800/60 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {info.invitedBy.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-indigo-400 uppercase tracking-wide">Invitation de</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{info.invitedBy.name}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAcceptExisting}
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <RiShieldUserLine />
                      Accepter et obtenir les droits admin
                    </>
                  )}
                </button>

                <Link
                  href="/login"
                  className="block text-center text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-3 flex items-center justify-center gap-1"
                >
                  Se connecter d'abord
                  <RiArrowRightLine />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // État NOUVEAU COMPTE - Version équilibrée
  return (
    <div className="flex min-h-screen w-full bg-background-light dark:bg-background-dark">
      {/* Alert Container */}
      <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
        {showErrorAlert && (
          <Alert
            type="error"
            message={alertMessage}
            onClose={() => setShowErrorAlert(false)}
            autoClose={5000}
          />
        )}
        {showSuccessAlert && (
          <Alert
            type="success"
            message={alertMessage}
            onClose={() => setShowSuccessAlert(false)}
            autoClose={5000}
          />
        )}
      </div>

      {/* Main Content - Centered */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[1100px] grid md:grid-cols-2 gap-9 items-start">
          
          {/* Left Side - Carte élégante */}
          <div className="hidden md:block">
            <div className="bg-purple-100/50 dark:bg-slate-900 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/40 p-8 mt-19">
              {/* Logo et titre */}
              <div className="flex items-center gap-4 mb-8">
                <div className="relative w-14 h-14 flex-shrink-0">
                  <Image
                    src="/logo/logo.png"
                    alt="NestHub Logo"
                    fill
                    className="object-contain scale-[5.5] translate-y-6.5 ml-10"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-linear-to-r from-blue-400 via-sky-600 to-purple-500 bg-clip-text text-transparent tracking-tight ml-14 translate-y-6">
                    N E S T H U B
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-14 translate-y-4.5">
                    Administration
                  </p>
                </div>
              </div>

              {/* Carte d'invitation */}
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50/50 dark:from-indigo-900/10 dark:to-violet-900/5 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800/40 mb-7 translate-y-4.5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <GrUserAdmin  className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-violet-600 uppercase tracking-wider font-semibold mb-1">
                      Rôle assigné
                    </p>
                    <p className="text-base font-bold text-slate-800 dark:text-white mb-2">
                      Administrateur NESTHUB
                    </p>
                    {info.invitedBy && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span>Invitation de :</span>
                        <span className="font-semibold text-violet-700 dark:text-indigo-400">{info.invitedBy.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Badge de vérification */}
              <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800/30 mb-6 mt-10">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0 ">
                  <MdOutlineVerified size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                    Vérification automatique
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    En tant qu'administrateur, votre compte sera vérifié immédiatement.
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-violet-100/75 dark:bg-slate-800/30 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">48 heures</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Expiration du lien</p>
                </div>
                <div className="bg-violet-100/75 dark:bg-slate-800/30 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Accès complet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Panel administrateur</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Formulaire */}
          <div className="flex flex-col">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600" />
              
              <div className="p-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-200 dark:border-indigo-800 mb-5">
                  <TfiEmail className="text-xs" /> Invitation reçue
                </div>

                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-2">
  Vous avez été invité !
</h1>

<p className="text-slate-600 dark:text-slate-400 mb-3">
  Rejoignez  notre plateforme <span className="font-bold text-slate-800 dark:text-slate-200">NESTHUB</span> en tant qu'administrateur.
</p>

{/* Version avec l'icône à côté de l'email */}
<div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-6">
  <RiMailOpenLine className="text-indigo-400" size={16} />
 <span className="font-semibold text-indigo-600 dark:text-indigo-400">: {info.email}</span>
</div>

                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                  {/* Prénom et Nom - inline */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Prénom
                      </label>
                      <div className="relative">
                        <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => handleChange("firstName", e.target.value)}
                          onBlur={() => handleBlur("firstName")}
                          placeholder="prénom"
                          className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
                            touched.firstName && errors.firstName 
                              ? "border-red-500 dark:border-red-500" 
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                          disabled={loading}
                        />
                      </div>
                      {touched.firstName && errors.firstName && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                          <MdOutlineDangerous size={14} />
                          <span>{errors.firstName}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Nom
                      </label>
                      <div className="relative">
                        <RiUserLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => handleChange("lastName", e.target.value)}
                          onBlur={() => handleBlur("lastName")}
                          placeholder="nom"
                          className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
                            touched.lastName && errors.lastName 
                              ? "border-red-500 dark:border-red-500" 
                              : "border-slate-200 dark:border-slate-700"
                          }`}
                          disabled={loading}
                        />
                      </div>
                      {touched.lastName && errors.lastName && (
                        <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                          <MdOutlineDangerous size={14} />
                          <span>{errors.lastName}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Nom d'utilisateur
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => handleChange("username", e.target.value)}
                        onBlur={() => handleBlur("username")}
                        placeholder="nom_utilisateur"
                        className={`w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
                          touched.username && errors.username 
                            ? "border-red-500 dark:border-red-500" 
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                        disabled={loading}
                      />
                    </div>
                    {touched.username && errors.username && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <MdOutlineDangerous size={14} />
                        <span>{errors.username}</span>
                      </p>
                    )}
                  </div>

                  {/* Mot de passe */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        onBlur={() => handleBlur("password")}
                        placeholder="Minimum 8 caractères"
                        className={`w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all ${
                          touched.password && errors.password 
                            ? "border-red-500 dark:border-red-500" 
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      >
                        {showPassword ? <RiEyeLine size={18} /> : <RiEyeOffLine size={18} />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <MdOutlineDangerous size={14} />
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>

                  {/* Terms checkbox */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400">
                      J'accepte les{" "}
                      <Link href={`/${locale}/terms`} className="text-violet-800 dark:text-indigo-400 hover:underline font-medium">
                        conditions d'utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link href={`/${locale}/privacy`} className="text-violet-800 dark:text-indigo-400 hover:underline font-medium">
                        politique de confidentialité
                      </Link>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin h-5 w-5" />
                        Création en cours...
                      </>
                    ) : (
                      <>
                        <MdMarkEmailRead  size={16} />
                        Accepter l'invitation
                      </>
                    )}
                  </button>
                </form>

                {/* Security badges */}
                <div className="mt-6 flex items-center justify-center gap-6 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <RiLockLine size={14} />
                    <span>Chiffrement E2E</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-700"></div>
                  <div className="flex items-center gap-1.5">
                    <RiShieldCheckLine size={14} />
                    <span>Accès sécurisé</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-primary dark:text-white font-bold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Background Décor */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-indigo-400/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[10%] -right-[5%] w-[35%] h-[35%] bg-violet-400/10 blur-[120px] rounded-full"></div>
      </div>
    </div>
  );
}