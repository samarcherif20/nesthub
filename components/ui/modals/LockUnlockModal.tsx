// components/modals/LockUnlockModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import RichTextEditor from '@/components/ui/editor/RichTextEditor';
import NotificationCheckbox from "@/components/ui/NotificationCheckbox";
import { User } from '@/lib/types/user';
import { useTranslations } from 'next-intl';
import { IoLockClosedOutline, IoLockOpenOutline } from 'react-icons/io5';

const pip = (url: string) =>
  `/api/admin/serve-image?url=${encodeURIComponent(url)}`;

interface LockUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLock: (userId: string, reason: string, notify: boolean) => Promise<void>;
  onUnlock: (userId: string, notify: boolean) => Promise<void>;
}

export default function LockUnlockModal({ isOpen, onClose, user, onLock, onUnlock }: LockUnlockModalProps) {
  const t = useTranslations('admin.usersManagement.lockUnlockModal');
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLocked = user?.status === 'LOCKED';

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setNotify(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleAction = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isLocked) {
        await onUnlock(user.id, notify);
      } else {
        if (!reason) return;
        await onLock(user.id, reason, notify);
      }
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      className="max-w-2xl"
      title={
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
            isLocked 
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
              : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
          }`}>
            {isLocked ? (
              <IoLockOpenOutline className="text-xl" />
            ) : (
              <IoLockClosedOutline className="text-xl" />
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
              {isLocked ? t('unlockTitle') : t('lockTitle')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {isLocked ? t('unlockDescription') : t('lockDescription')}
            </p>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-2">
        {/* User Identity Header */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700">
          {user.profilePictureUrl ? (
            <img 
              src={pip(user.profilePictureUrl)} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full ${
              isLocked ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-violet-100 dark:bg-violet-900/30'
            } flex items-center justify-center ${
              isLocked ? 'text-indigo-600 dark:text-indigo-400' : 'text-violet-600 dark:text-violet-400'
            } font-bold text-xs`}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs text-slate-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
          </div>
          <span className="text-[8px] font-medium px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded uppercase tracking-wider whitespace-nowrap">
            NESTHUB
          </span>
        </div>

        {/* Tentatives échouées (seulement si bloqué) */}
        {isLocked && (
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800">
            <p className="text-[10px] font-medium text-indigo-700 dark:text-indigo-400">
              {t('failedAttempts')}: <span className="font-bold">{user.loginAttempts || 0}</span>
            </p>
          </div>
        )}

        {/* Raison (seulement pour blocage) */}
        {!isLocked && (
          <div className="space-y-1">
            <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
              {t('reason')} <span className="text-red-500">*</span>
            </label>
            
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <RichTextEditor
                value={reason}
                onChange={setReason}
                placeholder={t('reasonPlaceholder')}
                compact={true}
              />
            </div>
          </div>
        )}

        {/* Notification Checkbox */}
        <div className="pt-1">
          <NotificationCheckbox
            notify={notify}
            setNotify={setNotify}
            userEmail={user.email}
            label={isLocked ? t('notifyUnlock') : t('notifyLock')}
            message={isLocked 
              ? "Un email sera envoyé à {email} pour le notifier du déblocage de son compte."
              : "Un email sera envoyé à {email} pour le notifier du blocage de son compte."
            }
            colorScheme={isLocked ? "indigo" : "purple"}
          />
        </div>
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          type="button"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleAction}
          disabled={loading || (!isLocked && !reason)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1 ${
            isLocked 
              ? 'bg-indigo-600 hover:bg-indigo-700' 
              : 'bg-violet-600 hover:bg-violet-700'
          }`}
          type="button"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('processing')}
            </>
          ) : (
            isLocked ? t('unlock') : t('lock')
          )}
        </button>
      </div>
    </Modal>
  );
}