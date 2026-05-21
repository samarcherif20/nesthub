import { useState, useEffect } from 'react'
import { useAuth } from "@clerk/nextjs";

export function useDashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken({ template: "my-app-template" });
        
        const [dashboardRes, pendingRes] = await Promise.all([
          fetch('/api/admin/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch('/api/admin/verifications/pending-old', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const dashboardData = await dashboardRes.json();
        const pendingData = await pendingRes.json();
        
        const count = pendingData.count || 0;
        
        setData(dashboardData);
        setPendingVerificationsCount(count);
        
        // Vérifier si on doit envoyer une notification (1 fois par 24h)
        if (count > 0) {
          const lastNotificationDate = localStorage.getItem("lastVerificationReminder");
          const today = new Date().toDateString();
          
          // Si pas de notification aujourd'hui, en créer une
          if (lastNotificationDate !== today) {
            await fetch('/api/admin/notifications/verification-reminder', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ count })
            });
            localStorage.setItem("lastVerificationReminder", today);
          }
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  return { data, loading, error, pendingVerificationsCount }
}