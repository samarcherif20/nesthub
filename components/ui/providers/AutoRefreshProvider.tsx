"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    // ✅ Rafraîchissement toutes les 10 secondes (suffisant)
    const interval = setInterval(() => {
      router.refresh();
    }, 10000); // 10 secondes

    // ✅ Rafraîchissement immédiat quand l'utilisateur revient sur l'onglet
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // ✅ Rafraîchissement quand la page reçoit le focus
    window.addEventListener("focus", () => router.refresh());

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  return <>{children}</>;
}
