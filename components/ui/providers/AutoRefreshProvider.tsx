"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function AutoRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // Rafraîchissement toutes les 30 secondes (plus long)
    const interval = setInterval(() => {
      // Ne pas rafraîchir si l'utilisateur interagit avec un lien
      router.refresh();
    }, 500000); 

    // Rafraîchissement quand la page reçoit le focus (uniquement si pas d'interaction)
    let timeoutId: NodeJS.Timeout;
    const handleFocus = () => {
      // Délai pour éviter les conflits
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        router.refresh();
      }, 500);
    };
    
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  return <>{children}</>;
}