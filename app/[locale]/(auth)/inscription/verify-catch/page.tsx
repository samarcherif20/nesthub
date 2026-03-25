"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignUp, useUser } from "@clerk/nextjs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function VerifyCatchPage() {
  const { isLoaded: signUpLoaded } = useSignUp();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!signUpLoaded || !userLoaded) return;

    async function verify() {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get("__clerk_status");

      console.log("🔍 VerifyCatchPage - status:", status);

      if (status !== "verified") {
        router.replace("/fr/inscription?error=invalid_link");
        return;
      }

      // ✅ If Clerk already signed the user in, sync the real ID to DB NOW
      // so steps 2-4 can find the user by clerkId
      if (isSignedIn && user) {
        const tempId = localStorage.getItem("currentUserId");
        console.log("👤 Real Clerk ID:", user.id, "| Temp ID:", tempId);

        if (tempId && tempId !== user.id) {
          console.log("🔄 Syncing clerkId in DB:", tempId, "→", user.id);
          
          try {
            await fetch("/api/users/update-clerk-id", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                oldClerkId: tempId,
                newClerkId: user.id,
              }),
            });
            console.log("✅ DB clerkId updated to:", user.id);
          } catch (err) {
            console.error("❌ Failed to update clerkId:", err);
          }

          localStorage.setItem("currentUserId", user.id);
        }
      }

      router.replace("/fr/inscription?verified=true");
    }

    verify();
  }, [signUpLoaded, userLoaded, isSignedIn]);

return (
  <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-blue-100 flex items-center justify-center">
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 animate-ping opacity-75"></div>
        <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 shadow-lg shadow-blue-500/30">
          <LoadingSpinner className="animate-spin h-8 w-8 text-white" />
        </div>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
        Vérification en cours
      </h2>
      <p className="text-sm text-gray-600">
        Veuillez patienter pendant que nous vérifions votre compte...
      </p>
    </div>
  </div>

);
}