// app/[locale]/admin/users/page.tsx
'use client';

import React from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { useAdminUsers } from './hooks/useAdminUsers';
import { decodeJWT } from '@/lib/utils/jwt'; // à créer

import SearchBar from '@/components/ui/SearchBar';
import FilterSelect from '@/components/ui/FilterSelect';
import DateRangePicker from '@/components/ui/DateRangePicker';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Alert from '@/components/ui/Alert';
import StatsCard from '@/components/ui/StatsCard'; // à extraire

import UserStatusBadge from '@/components/ui/badges/UserStatusBadge';
import UserRoleBadge from '@/components/ui/badges/UserRoleBadge';
import UserVerificationBadge from '@/components/ui/badges/UserVerificationBadge';

// Modales
import SuspendUserModal from '@/components/ui/modals/SuspendUserModal';
import BanUserModal from '@/components/ui/modals/BanUserModal';
import ActivateUserModal from '@/components/ui/modals/ActivateUserModal';
import LockUnlockModal from '@/components/ui/modals/LockUnlockModal';
import EscalateUserModal from '@/components/ui/modals/EscalateUserModal';
import AddNoteModal from '@/components/ui/modals/AddNoteModal';
import ActionsHistoryModal from '@/components/ui/modals/ActionsHistoryModal';
import WarningUserModal from '@/components/ui/modals/WarningUserModal';

// Icônes
import {
  IoDownloadOutline,
  IoEyeOutline,
  IoPauseCircleOutline,
  IoBanOutline,
  IoRefreshOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline,
  IoLockClosedOutline,
  IoLockOpenOutline,
  IoCreateOutline,
  IoArrowUpCircleOutline,
  IoArrowUndoOutline,
} from 'react-icons/io5';
import { MdOutlineVerified } from 'react-icons/md';
import { BsFiletypeCsv, BsFiletypePdf, BsTelephone } from 'react-icons/bs';

export default function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const t = useTranslations('admin.usersManagement');
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = React.useState<boolean | null>(null);

  // Vérification des droits admin
  React.useEffect(() => {
    const checkAdmin = async () => {
      if (!isUserLoaded || !clerkUser) {
        setIsAdmin(false);
        return;
      }
      try {
        const token = await getToken({ template: 'my-app-template' });
        if (!token) {
          setIsAdmin(false);
          return;
        }
        const decoded = decodeJWT(token);
        setIsAdmin(decoded?.role === 'ADMIN');
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [isUserLoaded, clerkUser, getToken]);

  // Hook principal
  const {
    users,
    stats,
    actions,
    pagination,
    loading,
    error,
    success,
    setSuccess,
    setError,
    filters,
    setFilter,
    resetFilters,
    selectedUsers,
    selectedUser,
    handleSelectAll,
    handleSelectUser,
    setPage,
    // Modales
    showSuspendModal,
    showBanModal,
    showActivateModal,
    showLockUnlockModal,
    showEscalateModal,
    showAddNoteModal,
    showWarningModal,
    showActionsHistory,
    showExportOptions,
    openSuspendModal,
    openBanModal,
    openActivateModal,
    openLockUnlockModal,
    openEscalateModal,
    openAddNoteModal,
    openWarningModal,
    openActionsHistory,
    toggleExportOptions,
    closeModals,
    // Actions
    handleSuspend,
    handleBan,
    handleActivate,
    handleLock,
    handleUnlock,
    handleEscalate,
    handleAddNote,
    handleWarning,
    handleUndoAction,
    handleExport,
  } = useAdminUsers();

  // Écrans de chargement / non autorisé
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

  // Options pour les filtres
  const roleOptions = [
    { value: 'ALL', label: t('filters.role.all') },
    { value: 'ADMIN', label: t('filters.role.admin') },
    { value: 'PROPERTY_OWNER', label: t('filters.role.property_owner') },
    { value: 'TENANT', label: t('filters.role.tenant') },
  ];

  const statusOptions = [
    { value: 'ALL', label: t('filters.status.all') },
    { value: 'ACTIVE', label: t('filters.status.active') },
    { value: 'PENDING_VALIDATION', label: t('filters.status.pending') },
    { value: 'TEMPORARILY_SUSPENDED', label: t('filters.status.suspended') },
    { value: 'PERMANENTLY_BANNED', label: t('filters.status.banned') },
    { value: 'REJECTED', label: t('filters.status.rejected') },
    { value: 'LOCKED', label: 'Bloqués' },
    { value: 'INACTIVE', label: 'Inactifs' },
  ];

  const verificationOptions = [
    { value: 'ALL', label: t('filters.verification.all') },
    { value: 'VERIFIED', label: t('filters.verification.verified') },
    { value: 'PENDING', label: t('filters.verification.pending') },
    { value: 'REJECTED', label: t('filters.verification.rejected') },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
            {t('page.title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('page.description')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openActionsHistory}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <IoArrowUndoOutline className="w-4 h-4" />
            Historique
          </button>

          <div className="relative">
            <button
              onClick={toggleExportOptions}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <IoDownloadOutline className="w-4 h-4" />
              {t('actions.export')}
            </button>

            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3"
                >
                  <BsFiletypeCsv className="text-green-600" />
                  <div>
                    <p className="font-medium">CSV</p>
                    <p className="text-xs text-slate-500">Pour Excel / analyse</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 border-t border-slate-200 dark:border-slate-700"
                >
                  <BsFiletypePdf className="text-red-600" />
                  <div>
                    <p className="font-medium">PDF</p>
                    <p className="text-xs text-slate-500">Pour impression / partage</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alertes */}
      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatsCard
            title={t('stats.totalUsers')}
            value={stats.totalUsers}
            icon={<IoRefreshOutline className="w-5 h-5 text-primary" />}
            color="bg-primary/10"
          />
          <StatsCard
            title={t('stats.newUsers30d')}
            value={stats.newUsers30d}
            icon={<IoRefreshOutline className="w-5 h-5 text-emerald-600" />}
            color="bg-emerald-100"
          />
          <StatsCard
            title={t('stats.activeUsers')}
            value={stats.activeUsers}
            icon={<IoEyeOutline className="w-5 h-5 text-green-600" />}
            color="bg-green-100"
          />
          <StatsCard
            title={t('stats.pendingUsers')}
            value={stats.pendingUsers}
            icon={<IoPauseCircleOutline className="w-5 h-5 text-amber-600" />}
            color="bg-amber-100"
          />
          <StatsCard
            title="Suspendus"
            value={stats.suspendedUsers}
            icon={<IoPauseCircleOutline className="w-5 h-5 text-orange-600" />}
            color="bg-orange-100"
          />
          <StatsCard
            title="Bannis"
            value={stats.bannedUsers}
            icon={<IoBanOutline className="w-5 h-5 text-red-600" />}
            color="bg-red-100"
          />
          <StatsCard
            title="Bloqués"
            value={stats.lockedUsers || 0}
            icon={<IoLockClosedOutline className="w-5 h-5 text-slate-600" />}
            color="bg-slate-100"
          />
          <StatsCard
            title={t('stats.verifiedIdentity')}
            value={`${stats.verifiedIdentity}%`}
            icon={<MdOutlineVerified className="w-5 h-5 text-blue-600" />}
            color="bg-blue-100"
          />
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <SearchBar
            value={filters.search}
            onChange={(value) => setFilter('search', value)}
            placeholder={t('filters.searchPlaceholder')}
            className="w-full lg:flex-1 min-w-[200px]"
          />

          <FilterSelect
            value={filters.role}
            onChange={(value) => setFilter('role', value)}
            options={roleOptions}
            className="w-full sm:w-[180px]"
          />

          <FilterSelect
            value={filters.status}
            onChange={(value) => setFilter('status', value)}
            options={statusOptions}
            className="w-full sm:w-[180px]"
          />

          <FilterSelect
            value={filters.verificationStatus}
            onChange={(value) => setFilter('verificationStatus', value)}
            options={verificationOptions}
            className="w-full sm:w-[180px]"
          />
        </div>

        {/* Filtres avancés */}
        <details className="text-sm">
          <summary className="cursor-pointer text-primary font-medium">
            {t('filters.advanced.title')}
          </summary>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('filters.advanced.dateRange')}
                </label>
                <DateRangePicker
                  startDate={filters.dateFrom}
                  endDate={filters.dateTo}
                  onStartDateChange={(date) => setFilter('dateFrom', date)}
                  onEndDateChange={(date) => setFilter('dateTo', date)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('filters.advanced.minReliability')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.minReliability}
                  onChange={(e) => setFilter('minReliability', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg"
                  placeholder="Min 0%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('filters.advanced.maxFraud')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.maxFraud}
                  onChange={(e) => setFilter('maxFraud', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg"
                  placeholder="Max 100%"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                {t('actions.reset')}
              </button>
            </div>
          </div>
        </details>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500">{t('messages.noUsers')}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Utilisateur
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Rôle
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Vérification
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Fiabilité
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">
                      Inscription
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr
                      key={`${user.id}-${user.status}`}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                            {user.profilePictureUrl ? (
                              <Image
                                src={user.profilePictureUrl}
                                alt={`${user.firstName} ${user.lastName}`}
                                width={32}
                                height={32}
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-sm">
                                {user.firstName?.[0]}
                                {user.lastName?.[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-slate-500">ID: {user.id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{user.email}</p>
                        {user.phoneNumber && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <BsTelephone className="w-3 h-3" />
                            {user.phoneNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <UserRoleBadge role={user.role} t={t} />
                      </td>
                      <td className="px-4 py-3">
                        <UserStatusBadge
                          status={user.status}
                          t={t}
                          suspendedUntil={user.suspendedUntil}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <UserVerificationBadge
                          isVerified={user.isIdentityVerified}
                          status={user.verificationRequests?.[0]?.status}
                          t={t}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                (user.reliabilityScore || 0) >= 70
                                  ? 'bg-emerald-500'
                                  : (user.reliabilityScore || 0) >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${user.reliabilityScore || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{user.reliabilityScore || 0}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString(locale)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Détails */}
                          <button
                            onClick={() => router.push(`/${locale}/admin/users/${user.id}`)}
                            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg"
                            title="Voir détails"
                          >
                            <IoEyeOutline className="w-4 h-4" />
                          </button>

                          {/* Note */}
                          <button
                            onClick={() => openAddNoteModal(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Ajouter une note"
                          >
                            <IoCreateOutline className="w-4 h-4" />
                          </button>

                          {/* Avertissement */}
                          {user.status === 'ACTIVE' && (
                            <button
                              onClick={() => openWarningModal(user)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                              title="Envoyer un avertissement"
                            >
                              <IoWarningOutline className="w-4 h-4" />
                            </button>
                          )}

                          {/* Réactivation */}
                          {(user.status === 'TEMPORARILY_SUSPENDED' ||
                            user.status === 'PERMANENTLY_BANNED') && (
                            <button
                              onClick={() => openActivateModal(user)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Réactiver"
                            >
                              <IoCheckmarkCircleOutline className="w-4 h-4" />
                            </button>
                          )}

                          {/* Déblocage */}
                          {user.status === 'LOCKED' && (
                            <button
                              onClick={() => openLockUnlockModal(user)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Débloquer"
                            >
                              <IoLockOpenOutline className="w-4 h-4" />
                            </button>
                          )}

                          {/* Actions pour utilisateurs actifs */}
                          {user.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => openLockUnlockModal(user)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Bloquer"
                              >
                                <IoLockClosedOutline className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openSuspendModal(user)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Suspendre"
                              >
                                <IoPauseCircleOutline className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Bannissement et escalade (sauf si déjà banni) */}
                          {user.status !== 'PERMANENTLY_BANNED' && (
                            <>
                              <button
                                onClick={() => openBanModal(user)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Bannir"
                              >
                                <IoBanOutline className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEscalateModal(user)}
                                className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                title="Escalade progressive"
                              >
                                <IoArrowUpCircleOutline className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700">
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
        )}
      </div>

      {/* Modales */}
      <SuspendUserModal
        isOpen={showSuspendModal}
        onClose={closeModals}
        user={selectedUser}
        onConfirm={handleSuspend}
      />
      <BanUserModal
        isOpen={showBanModal}
        onClose={closeModals}
        user={selectedUser}
        onConfirm={handleBan}
      />
      <ActivateUserModal
        isOpen={showActivateModal}
        onClose={closeModals}
        user={selectedUser}
        onConfirm={handleActivate}
      />
      <LockUnlockModal
        isOpen={showLockUnlockModal}
        onClose={closeModals}
        user={selectedUser}
        onLock={handleLock}
        onUnlock={handleUnlock}
      />
      <EscalateUserModal
        isOpen={showEscalateModal}
        onClose={closeModals}
        user={selectedUser}
        onEscalate={handleEscalate}
        currentLevel={selectedUser?.escalationLevel || 0}
      />
      <AddNoteModal
        isOpen={showAddNoteModal}
        onClose={closeModals}
        user={selectedUser}
        onAddNote={handleAddNote}
      />
      <WarningUserModal
        isOpen={showWarningModal}
        onClose={closeModals}
        user={selectedUser}
        onConfirm={handleWarning}
      />
      <ActionsHistoryModal
        isOpen={showActionsHistory}
        onClose={closeModals}
        actions={actions}
        onUndo={handleUndoAction}
      />
    </div>
  );
}