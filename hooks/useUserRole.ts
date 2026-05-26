// hooks/useUserRole.ts
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function useUserRole() {
  const { user: clerkUser, isLoaded } = useUser();
  const [role, setRole] = useState<"tenant" | "owner" | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbRole, setDbRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/users/me");
        const data = await res.json();
        const userDbRole = data.user?.role;
        setDbRole(userDbRole);

        if (userDbRole === "BOTH") {
          const savedRole = localStorage.getItem("selectedRole") as "tenant" | "owner" | null;
          
          if (savedRole === "tenant" || savedRole === "owner") {
            setRole(savedRole);
          } else {
            setRole(null);
          }
        } 
        else if (userDbRole === "TENANT") {
          setRole("tenant");
        } 
        else if (userDbRole === "PROPERTY_OWNER") {
          setRole("owner");
        }
        else {
          setRole(null);
        }
      } catch (error) {
        console.error("Erreur:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [isLoaded, clerkUser]);

  return { role, loading, dbRole, isBoth: dbRole === "BOTH" && !role };
}