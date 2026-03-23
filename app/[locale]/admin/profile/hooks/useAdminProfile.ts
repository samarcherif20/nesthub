// hooks/useAdminProfile.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

interface AdminProfile {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLogin: string | null;
  bio: string | null;
  stats?: {
    totalActions: number;
    actionsThisMonth: number;
    accessLevel: number;
  };
}

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

export function useAdminProfile() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: 'my-app-template' });
      if (!token) throw new Error('Token non disponible');

      console.log('📡 fetchProfile URL: /api/admin/profile');
      
      const res = await fetch('/api/admin/profile', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📡 fetchProfile status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur chargement profil');
      }
      
      const data = await res.json();
      console.log('✅ fetchProfile data:', data);
      
      setProfile(data.profile);
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('❌ fetchProfile error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const updateProfile = useCallback(async (data: Partial<AdminProfile>) => {
    try {
      const token = await getToken({ template: 'my-app-template' });
      if (!token) throw new Error('Token non disponible');

      console.log('📡 updateProfile - Body:', data);

      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      console.log('📡 updateProfile status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur mise à jour');
      }
      
      setSuccess('Profil mis à jour avec succès');
      fetchProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('❌ updateProfile error:', err);
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }, [getToken, fetchProfile]);

  const updatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      const token = await getToken({ template: 'my-app-template' });
      if (!token) throw new Error('Token non disponible');

      const res = await fetch('/api/admin/profile/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur changement mot de passe');
      }
      
      setSuccess('Mot de passe mis à jour avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }, [getToken]);

  const toggle2FA = useCallback(async (enabled: boolean) => {
    try {
      const token = await getToken({ template: 'my-app-template' });
      if (!token) throw new Error('Token non disponible');

      const res = await fetch('/api/admin/profile/2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur modification 2FA');
      }
      
      setSuccess(`2FA ${enabled ? 'activée' : 'désactivée'} avec succès`);
      fetchProfile();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }, [getToken, fetchProfile]);

  const terminateSession = useCallback(async (sessionId: string) => {
    try {
      const token = await getToken({ template: 'my-app-template' });
      if (!token) throw new Error('Token non disponible');

      const res = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur terminaison session');
      }
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSuccess('Session terminée');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }, [getToken]);

  const terminateAllSessions = useCallback(async () => {
    try {
      const token = await getToken({ template: 'my-app-template' });
      if (!token) throw new Error('Token non disponible');

      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur terminaison sessions');
      }
      
      setSessions(prev => prev.filter(s => s.isCurrent));
      setSuccess('Toutes les autres sessions sont terminées');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  }, [getToken]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    sessions,
    loading,
    error,
    success,
    setError,
    updateProfile,
    updatePassword,
    toggle2FA,
    terminateSession,
    terminateAllSessions,
    refresh: fetchProfile,
  };
}