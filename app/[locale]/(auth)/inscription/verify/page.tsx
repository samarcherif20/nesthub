"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function VerifyPage() {
  const { handleEmailLinkVerification } = useClerk();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        console.log("🔵 Page verify chargée, URL:", window.location.href);
        
        await handleEmailLinkVerification({
          redirectUrlComplete: `${window.location.origin}/fr/inscription?verified=true`,
        });
        
        // Si on arrive ici, la vérification a réussi
        console.log("✅ Vérification réussie");
        setStatus("success");
        
        setTimeout(() => {
          router.push("/fr/inscription?verified=true");
        }, 2000);
        
      } catch (err: any) {
        console.error("🔴 Erreur de vérification:", err);
        
        // Vérifier le type d'erreur en fonction du message
        if (err.message?.includes("expired") || err.code === "expired") {
          setStatus("expired");
          setErrorMessage("Le lien de vérification a expiré. Veuillez demander un nouveau lien.");
        } else {
          setStatus("error");
          setErrorMessage(err.message || "La vérification a échoué");
        }
      }
    }

    verify();
  }, [handleEmailLinkVerification, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1E3F] to-[#112B4E] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl p-8 text-white"
      >
        {status === "loading" && (
          <>
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-center">Vérification en cours</h1>
            <p className="text-gray-300 text-center">
              Nous vérifions votre adresse email...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-center text-green-400">Email vérifié !</h1>
            <p className="text-gray-300 text-center mb-4">
              Votre adresse email a été confirmée avec succès.
            </p>
            <p className="text-sm text-gray-400 text-center">
              Redirection vers l'étape suivante...
            </p>
          </>
        )}

        {status === "expired" && (
          <>
            <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-center text-yellow-400">Lien expiré</h1>
            <p className="text-gray-300 text-center mb-6">
              {errorMessage}
            </p>
            <Link
              href="/fr/inscription"
              className="block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors text-center"
            >
              Retour à l'inscription
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-center text-red-400">Échec de la vérification</h1>
            <p className="text-gray-300 text-center mb-6">
              {errorMessage}
            </p>
            <Link
              href="/fr/inscription"
              className="block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors text-center"
            >
              Retour à l'inscription
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}