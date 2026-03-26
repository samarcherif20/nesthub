// app/[locale]/(auth)/forgot-password/hooks/useForgotPassword.ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function useForgotPassword() {
  const router = useRouter();
  const locale = useLocale();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [mounted, setMounted] = useState(true);

  const validateEmail = (email: string) => {
    if (!email.trim()) return "L'email est requis";
    if (!email.includes("@") || !email.includes(".")) return "Email invalide";
    return null;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (touched) setError(null);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage(`Un lien de réinitialisation a été envoyé à ${email}`);
      } else {
        setError(data.error || "Une erreur est survenue");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const closeError = () => setError(null);
  const closeSuccess = () => setSuccessMessage(null);

  const handleBackToLogin = () => {
    router.push(`/${locale}/login`);
  };

  return {
    email,
    loading,
    error,
    successMessage,
    touched,
    mounted,
    handleEmailChange,
    handleBlur,
    handleSubmit,
    closeError,
    closeSuccess,
    handleBackToLogin,
  };
}