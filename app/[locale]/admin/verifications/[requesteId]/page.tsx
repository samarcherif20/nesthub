// app/[locale]/admin/verifications/[requestId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';

const MaterialIcon = ({ name }: { name: string }) => (
  <span className="material-symbols-outlined">{name}</span>
);

interface ExtractedData {
  cinNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string;
  expiryDate?: string;
  sex?: string;
  address?: string;
}

export default function VerificationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; requestId: string }>
}) {
  const { locale, requestId } = React.use(params);
  // Renommer la variable pour éviter le conflit
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [request, setRequest] = useState<any>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionMotif, setRejectionMotif] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // OCR extracted data
  const extractedData: ExtractedData = request?.extractedData || {};

  // Vérification admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isUserLoaded || !clerkUser) return;
      const token = await getToken({ template: 'my-app-template' });
      if (token) {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(decoded?.role === 'ADMIN');
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [isUserLoaded, clerkUser, getToken]);

  // Charger la demande
  useEffect(() => {
    if (isAdmin === true && requestId) {
      fetchRequest();
    }
  }, [isAdmin, requestId]);

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: 'my-app-template' });
      const res = await fetch(`/api/admin/verifications/${requestId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Erreur chargement');
      const data = await res.json();
      setRequest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    setSubmitting(true);
    try {
      const token = await getToken({ template: 'my-app-template' });
      const res = await fetch(`/api/admin/verifications/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'VALIDATE',
          adminComment
        })
      });

      if (!res.ok) throw new Error('Erreur lors de la validation');
      
      setSuccess('Demande validée avec succès !');
      setTimeout(() => {
        router.push(`/${locale}/admin/verifications`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionMotif) {
      setError('Veuillez fournir un motif de rejet');
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken({ template: 'my-app-template' });
      const res = await fetch(`/api/admin/verifications/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'REJECT',
          rejectionMotif,
          adminComment
        })
      });

      if (!res.ok) throw new Error('Erreur lors du rejet');
      
      setSuccess('Demande rejetée');
      setTimeout(() => {
        router.push(`/${locale}/admin/verifications`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isUserLoaded || isAdmin === null || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Accès non autorisé</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Demande non trouvée</div>
      </div>
    );
  }

  // Renommé pour éviter le conflit
  const requestUser = request.user;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href={`/${locale}/admin/verifications`} className="text-slate-500 hover:text-primary">
            <MaterialIcon name="arrow_back" />
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">File d&apos;attente</span>
            <MaterialIcon name="chevron_right" />
            <span className="font-medium">Demande #{requestId.slice(-5)}</span>
          </nav>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full text-xs font-medium text-amber-700">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          En attente de validation
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Documents */}
        <div className="w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-semibold flex items-center gap-2">
              <MaterialIcon name="image" />
              Documents fournis
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Recto */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">Recto CIN</span>
                <a href={request.documentFrontUrl} target="_blank" className="text-xs text-primary hover:underline">
                  Télécharger
                </a>
              </div>
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <img src={request.documentFrontUrl} alt="CIN Recto" className="w-full object-contain" />
              </div>
            </div>

            {/* Verso */}
            {request.documentBackUrl && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs font-bold uppercase text-slate-500">Verso CIN</span>
                  <a href={request.documentBackUrl} target="_blank" className="text-xs text-primary hover:underline">
                    Télécharger
                  </a>
                </div>
                <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <img src={request.documentBackUrl} alt="CIN Verso" className="w-full object-contain" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Details & Actions */}
        <div className="w-1/2 flex flex-col bg-white dark:bg-slate-900">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-xl mx-auto space-y-8">
              {/* User profile - Utilise requestUser au lieu de user */}
              <div className="flex gap-6">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden">
                  {requestUser.profilePictureUrl ? (
                    <img src={requestUser.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-2xl text-primary">
                      {requestUser.firstName?.[0]}{requestUser.lastName?.[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{requestUser.firstName} {requestUser.lastName}</h2>
                  <p className="text-slate-500 mt-1">
                    Membre depuis {new Date(requestUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* OCR Extracted Data */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold uppercase text-slate-400 flex items-center gap-2">
                  <span className="w-8 h-px bg-slate-200"></span>
                  Données extraites (OCR)
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {extractedData.firstName && (
                    <div>
                      <label className="text-xs text-slate-500">Prénom</label>
                      <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg font-medium">
                        {extractedData.firstName}
                      </div>
                    </div>
                  )}
                  
                  {extractedData.lastName && (
                    <div>
                      <label className="text-xs text-slate-500">Nom</label>
                      <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg font-medium">
                        {extractedData.lastName}
                      </div>
                    </div>
                  )}

                  {extractedData.cinNumber && (
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500">Numéro CIN</label>
                      <div className="mt-1 p-3 bg-white border-2 border-primary/20 rounded-lg font-mono font-bold flex items-center gap-2">
                        <MaterialIcon name="badge" />
                        {extractedData.cinNumber}
                      </div>
                    </div>
                  )}

                  {extractedData.dateOfBirth && (
                    <div>
                      <label className="text-xs text-slate-500">Date naissance</label>
                      <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                        {new Date(extractedData.dateOfBirth).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {extractedData.placeOfBirth && (
                    <div>
                      <label className="text-xs text-slate-500">Lieu naissance</label>
                      <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                        {extractedData.placeOfBirth}
                      </div>
                    </div>
                  )}

                  {extractedData.nationality && (
                    <div>
                      <label className="text-xs text-slate-500">Nationalité</label>
                      <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                        {extractedData.nationality}
                      </div>
                    </div>
                  )}

                  {extractedData.expiryDate && (
                    <div>
                      <label className="text-xs text-slate-500">Date expiration</label>
                      <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                        {new Date(extractedData.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {extractedData.address && (
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500">Adresse</label>
                      <div className="mt-1 p-3 bg-slate-50 rounded-lg">
                        {extractedData.address}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Actions */}
              <section className="space-y-4 pt-6 border-t border-slate-200">
                <h3 className="text-lg font-bold">Finaliser la vérification</h3>
                
                {error && (
                  <Alert type="error" message={error} onClose={() => setError(null)} />
                )}
                
                {success && (
                  <Alert type="success" message={success} onClose={() => setSuccess(null)} />
                )}

                {/* Note interne */}
                <div>
                  <label className="text-sm font-medium">Note interne (optionnelle)</label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    placeholder="Ajouter une note pour l'audit..."
                    className="mt-1 w-full rounded-lg border-slate-200 focus:ring-primary"
                    rows={2}
                  />
                </div>

                {/* Boutons action */}
                <div className="flex gap-4">
                  <button
                    onClick={handleValidate}
                    disabled={submitting}
                    className="flex-1 py-4 px-6 rounded-xl bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 disabled:opacity-50"
                  >
                    <MaterialIcon name="check_circle" />
                    {submitting ? 'Traitement...' : 'VALIDER'}
                  </button>
                  
                  <button
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    disabled={submitting}
                    className="flex-1 py-4 px-6 rounded-xl border-2 border-rose-500 text-rose-600 font-bold flex items-center justify-center gap-2 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <MaterialIcon name="cancel" />
                    REJETER
                  </button>
                </div>

                {/* Formulaire de rejet */}
                {showRejectForm && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl space-y-3">
                    <label className="text-sm font-bold text-rose-700">
                      Motif de rejet *
                    </label>
                    <textarea
                      value={rejectionMotif}
                      onChange={(e) => setRejectionMotif(e.target.value)}
                      placeholder="Document flou, expiré, données non concordantes..."
                      className="w-full rounded-lg border-rose-200 focus:ring-rose-500"
                      rows={3}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {['Document flou', 'CIN expirée', 'Nom différent', 'Photo non conforme'].map((motif) => (
                        <button
                          key={motif}
                          onClick={() => setRejectionMotif(motif)}
                          className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs hover:border-primary"
                        >
                          {motif}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleReject}
                      disabled={submitting || !rejectionMotif}
                      className="w-full py-3 bg-rose-600 text-white rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50"
                    >
                      Confirmer le rejet
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}