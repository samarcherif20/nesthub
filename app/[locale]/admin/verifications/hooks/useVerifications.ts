import { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';

export interface VerificationRequest {
  id: string;
  status: string;
  submittedAt: string;
  documentFrontUrl: string;
  documentBackUrl: string | null;
  extractedData: any;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profilePictureUrl: string | null;
    role: string;
    createdAt: string;
  };
}

export interface StatsData {
  pendingCount: number;
  estimatedWaitTime: number;
  processedToday: number;
  averageProcessingTime: number;
}

export interface PaginationData {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export function useVerifications() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();

  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Vérification des droits admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isUserLoaded || !user) {
        setIsAdmin(false);
        return;
      }
      try {
        const token = await getToken({ template: 'my-app-template' });
        if (!token) {
          setIsAdmin(false);
          return;
        }
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(decoded?.role === 'ADMIN');
      } catch (err) {
        console.error('Erreur vérification admin:', err);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [isUserLoaded, user, getToken]);

  // Chargement des demandes
  const fetchRequests = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken({ template: 'my-app-template' });
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const res = await fetch(`/api/admin/verifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Erreur chargement');

      const data = await res.json();
      setRequests(data.requests);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, getToken, pagination.page, search]);

  // Déclencher le chargement quand l'admin est confirmé ou quand page/search change
  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin, fetchRequests]);

  // Fonctions d'interaction
  const setPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const refresh = () => {
    fetchRequests();
  };

  return {
    // États
    requests,
    stats,
    pagination,
    loading,
    error,
    search,
    isAdmin,
    isUserLoaded,
    // Actions
    setSearch,
    setPage,
    refresh,
    setError, // pour permettre à la page de réinitialiser l'erreur
  };
}