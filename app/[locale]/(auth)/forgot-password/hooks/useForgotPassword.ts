import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export function useForgotPassword(t: any) {
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [mounted, setMounted] = useState(true);

  const validateEmail = (email: string) => {
    if (!email.trim()) return t("errors.emailRequired");
    if (!email.includes("@") || !email.includes("."))
      return t("errors.emailInvalid");
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(t("success.message", { email: email }));
      } else {
        setError(data.error || t("errors.general"));
      }
    } catch (err) {
      setError(t("errors.connection"));
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
