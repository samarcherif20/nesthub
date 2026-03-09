'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl'; // optionnel
import { useVerifications } from './hooks/useVerifications';

import SearchBar from '@/components/ui/SearchBar';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import StatsCard from '@/components/ui/StatsCard';

// Icônes
import {
  MdOutlinePendingActions,
  MdOutlineFactCheck,
  MdMarkEmailRead,
} from 'react-icons/md';
import { TbRefresh, TbLayoutDashboard, TbHistoryToggle } from 'react-icons/tb';
import { FaRegCheckCircle } from 'react-icons/fa';
import { IoArrowForwardOutline } from 'react-icons/io5';

function formatRelativeTime(date: string) {
  const now = new Date();
  const then = new Date(date);
  const diffMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffMinutes < 120) return 'Il y a 1 heure';
  if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)} heures`;
  return `Il y a ${Math.floor(diffMinutes / 1440)} jours`;
}

export default function VerificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const router = useRouter();
  const t = useTranslations(); // si vous utilisez next-intl

  const {
    requests,
    stats,
    pagination,
    loading,
    error,
    search,
    isAdmin,
    isUserLoaded,
    setSearch,
    setPage,
    refresh,
    setError,
  } = useVerifications();

  // États de chargement / non autorisé
  if (!isUserLoaded || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 dark:text-gray-400">Vous devez être administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background-light dark:bg-background-dark min-h-screen">
      {/* En-tête avec statistiques */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            File de vérification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gérez les demandes de validation d'identité
          </p>
        </div>

        <div className="flex gap-3">
          <StatsCard
            title="En attente"
            value={stats?.pendingCount ?? 0}
            icon={<MdOutlinePendingActions size={20} />}
            color="bg-orange-100 dark:bg-orange-900/30 text-orange-600"
          />
          <StatsCard
            title="Traités ajd"
            value={stats?.processedToday ?? 0}
            icon={<MdOutlineFactCheck size={20} />}
            color="bg-primary/10 text-primary"
          />
        </div>
      </div>

      {/* Barre de recherche et actualisation */}
      {requests.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[280px]">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Rechercher un utilisateur..."
                className="w-full"
              />
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors"
            >
              <TbRefresh size={18} />
              Actualiser
            </button>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        ) : requests.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">
                      Utilisateur
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">
                      Rôle
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                            {req.user.profilePictureUrl ? (
                              <Image
                                src={req.user.profilePictureUrl}
                                alt={req.user.firstName || ''}
                                width={40}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-medium">
                                {req.user.firstName?.[0]}
                                {req.user.lastName?.[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {req.user.firstName} {req.user.lastName}
                            </p>
                            <p className="text-xs text-slate-500">
                              {req.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info" className="uppercase">
                          {req.user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatRelativeTime(req.submittedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="warning" className="flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          En attente
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/${locale}/admin/verifications/${req.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-300 transition-colors"
                        >
                          Traiter la demande
                          <IoArrowForwardOutline />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalCount}
                  pageSize={pagination.limit}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-500 rounded-full blur-3xl scale-150 opacity-15 dark:opacity-60"></div>
              <div className="relative w-72 h-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-32 h-32 bg-blue-100/50 rounded-full flex items-center justify-center">
                      <MdMarkEmailRead className="text-indigo-300" size={100} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                    <div className="w-12 h-2 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                  </div>
                  <div className="w-40 h-2 bg-slate-100 dark:bg-slate-700 rounded-full"></div>
                </div>
              </div>
              <div className="absolute -top-3 -right-4 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl">
                <FaRegCheckCircle className="text-white" size={32} />
              </div>
            </div>

            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight text-center">
              Toutes les vérifications sont terminées !
            </h3>

            <p className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-lg leading-relaxed text-center">
              Félicitations, votre file d'attente est vide. Vous serez notifié
              dès qu'un nouveau propriétaire soumettra ses documents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Link
                href={`/${locale}/admin/dashboard`}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <TbLayoutDashboard size={20} />
                <span>Retour au tableau de bord</span>
              </Link>
              <Link
                href={`/${locale}/admin/verifications/history`}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3 px-8 rounded-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <TbHistoryToggle size={20} />
                <span>Voir l'historique</span>
              </Link>
            </div>

            {stats && (stats.processedToday > 0 || stats.averageProcessingTime > 0) && (
              <div className="mt-12 flex items-center gap-8 py-4 px-8 bg-white/50 dark:bg-slate-800/50 rounded-full border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm">
                {stats.processedToday > 0 && (
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Traités aujourd'hui
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {stats.processedToday} dossiers
                    </span>
                  </div>
                )}
                {stats.averageProcessingTime > 0 && (
                  <>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Temps moyen
                      </span>
                      <span className="text-xl font-bold text-primary">
                        {stats.averageProcessingTime} min
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}