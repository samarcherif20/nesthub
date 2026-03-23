import { useState, useEffect, useRef, useCallback } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { getClerkErrorMessage, getClerkErrorCode, logger, ClerkLoginErrorCodes } from "@/lib/utils";

interface ErrorState {
  message: string;
  type: "invalid" | "expired" | "generic";
}

export function useVerifyCode() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRef = useRef(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [mounted, setMounted] = useState(false);
  const [pendingIdentifier, setPendingIdentifier] = useState<string | null>(null);
  const [pendingUserRole, setPendingUserRole] = useState<string | null>(null);

  const { signIn, setActive } = useSignIn();
  const router = useRouter();
  const t = useTranslations("Login");

  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Mettre à jour la ref quand le state change
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Récupérer les infos stockées
  useEffect(() => {
    setMounted(true);
    const identifier = sessionStorage.getItem("pendingIdentifier");
    const userRole = sessionStorage.getItem("pendingUserRole");

    setPendingIdentifier(identifier);
    setPendingUserRole(userRole);

    if (!identifier) {
      router.push("/fr/login");
    }
  }, [router]);

  // Timer pour l'expiration du code
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Vérifier si le code a expiré
  useEffect(() => {
    if (timeLeft === 0 && !error) {
      setError({
        type: "expired",
        message: t("codeExpired"),
      });
    }
  }, [timeLeft, error, t]);

  // Focus automatique sur le premier input
  useEffect(() => {
    if (mounted && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [mounted]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const closeError = useCallback(() => setError(null), []);
  const closeSuccess = useCallback(() => setSuccessMessage(null), []);

  const handleBackToLogin = useCallback(() => {
    router.push("/fr/login");
  }, [router]);

  // ✅ Version qui utilise la ref pour être sûre d'avoir les 6 chiffres
  const checkAndSubmit = useCallback(() => {
    const fullCode = codeRef.current.join("");
    if (fullCode.length === 6) {
      handleSubmitWithCode(fullCode);
    }
  }, []);

  const handleSubmitWithCode = useCallback(async (fullCode: string) => {
    setLoading(true);
    setError(null);
    logger.auth("Tentative de vérification 2FA");

    try {
      if (!signIn) throw new Error("SignIn not initialized");

      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: fullCode,
      });

      logger.success("Vérification 2FA réussie", { status: result.status });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });

        // ✅ Récupérer le rôle du sessionStorage AU MOMENT de la redirection
        const userRole = sessionStorage.getItem("pendingUserRole");
        console.log("👤 Rôle utilisateur pour redirection:", userRole);

        // Nettoyer le sessionStorage
        sessionStorage.removeItem("pendingIdentifier");
        sessionStorage.removeItem("pendingRole");
        sessionStorage.removeItem("pendingIdentifierType");
        sessionStorage.removeItem("pendingUserRole");

        // Redirection selon le rôle
        if (userRole === "ADMIN") {
          console.log("🚀 Redirection vers admin dashboard");
          router.push("/admin/dashboard");
        } else if (userRole === "PROPERTY_OWNER") {
          console.log("🚀 Redirection vers owner dashboard");
          router.push("/dashboard/owner");
        } else {
          console.log("🚀 Redirection vers renter dashboard");
          router.push("/dashboard/renter");
        }
      }
    } catch (err: unknown) {
      logger.error("Erreur vérification 2FA:", err);

      const errorCode = getClerkErrorCode(err);

      if (
        errorCode === ClerkLoginErrorCodes.CODE_INCORRECT ||
        errorCode === ClerkLoginErrorCodes.VERIFICATION_FAILED
      ) {
        setError({
          type: "invalid",
          message: t("incorrectCode"),
        });
      } else if (errorCode === ClerkLoginErrorCodes.CODE_EXPIRED) {
        setError({
          type: "expired",
          message: t("codeExpired"),
        });
      } else {
        const errorMessage = getClerkErrorMessage(err, "email", t);
        setError({
          type: "generic",
          message: errorMessage,
        });
      }
      
      // Réinitialiser les inputs en cas d'erreur
      setCode(["", "", "", "", "", ""]);
      codeRef.current = ["", "", "", "", "", ""];
      
      // Remettre le focus sur le premier input
      setTimeout(() => {
        if (inputRefs[0].current) {
          inputRefs[0].current.focus();
        }
      }, 100);
      
    } finally {
      setLoading(false);
    }
  }, [signIn, setActive, router, t, inputRefs]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    const fullCode = code.join("");
    if (fullCode.length === 6) {
      await handleSubmitWithCode(fullCode);
    } else {
      setError({
        type: "generic",
        message: t("codeRequired"),
      });
    }
  }, [code, handleSubmitWithCode, t]);

  const handleChange = useCallback((index: number, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, "");
    
    if (numericValue.length > 1) {
      const newCode = [...code];
      const chars = numericValue.split("");
      
      for (let i = 0; i < chars.length && index + i < 6; i++) {
        newCode[index + i] = chars[i];
      }
      
      setCode(newCode);
      codeRef.current = newCode;
      
      const lastIndex = Math.min(index + chars.length - 1, 5);
      if (lastIndex < 5) {
        setTimeout(() => {
          inputRefs[lastIndex + 1].current?.focus();
        }, 10);
      }
      
      if (codeRef.current.every(c => c !== "")) {
        setTimeout(() => checkAndSubmit(), 50);
      }
      
      return;
    }
    
    if (numericValue.length === 1) {
      const newCode = [...code];
      newCode[index] = numericValue;
      setCode(newCode);
      codeRef.current = newCode;
      
      if (index < 5) {
        setTimeout(() => {
          inputRefs[index + 1].current?.focus();
        }, 10);
      }
      
      if (codeRef.current.every(c => c !== "")) {
        setTimeout(() => checkAndSubmit(), 50);
      }
    }
    
    if (numericValue.length === 0) {
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      codeRef.current = newCode;
    }
  }, [code, inputRefs, checkAndSubmit]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!code[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }
    }
    
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  }, [code, inputRefs]);

  const handleResend = useCallback(async () => {
    setResendLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      logger.auth("Demande de renvoi de code");
      await signIn?.prepareSecondFactor({ strategy: "email_code" });
      setTimeLeft(600);
      setSuccessMessage(t("codeResent"));
    } catch (err: unknown) {
      logger.error("Erreur renvoi code:", err);
      const errorMessage = getClerkErrorMessage(err, "email", t);
      setError({
        type: "generic",
        message: errorMessage,
      });
    } finally {
      setResendLoading(false);
    }
  }, [signIn, t]);

  return {
    code,
    loading,
    error,
    successMessage,
    resendLoading,
    trustDevice,
    timeLeft,
    mounted,
    pendingIdentifier,
    pendingUserRole,
    inputRefs,
    setTrustDevice,
    handleChange,
    handleKeyDown,
    handleSubmit,
    handleResend,
    handleBackToLogin,
    closeError,
    closeSuccess,
    formatTime,
  };
}