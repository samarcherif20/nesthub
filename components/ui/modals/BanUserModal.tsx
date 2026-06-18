'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import RichTextEditor from '@/components/ui/editor/RichTextEditor';
import NotificationCheckbox from "@/components/ui/NotificationCheckbox";
import { User } from '@/lib/types/user';
import { useTranslations } from 'next-intl';
import { IoBanOutline } from 'react-icons/io5';

// ✅ Traduire les raisons de bannissement
const getBanReasons = (t: any) => [
  { value: 'SPAM', label: t('reasons.spam') },
  { value: 'HARASSMENT', label: t('reasons.harassment') },
  { value: 'TOS_VIOLATION', label: t('reasons.tosViolation') },
  { value: 'FRAUD', label: t('reasons.fraud') },
  { value: 'IDENTITY_THEFT', label: t('reasons.identityTheft') },
  { value: 'MULTIPLE_WARNINGS', label: t('reasons.multipleWarnings') },
  { value: 'ILLEGAL_ACTIVITY', label: t('reasons.illegalActivity') },
  { value: 'OTHER', label: t('reasons.other') },
];

const pip = (url: string) =>
  `/api/admin/serve-image?url=${encodeURIComponent(url)}`;

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: string, reason: string, motif: string, notify: boolean) => Promise<void>;
}

export default function BanUserModal({ isOpen, onClose, user, onConfirm }: BanUserModalProps) {
  const t = useTranslations('admin.usersManagement.banModal');
  const BAN_REASONS = getBanReasons(t);
  const [reason, setReason] = useState('');
  const [motif, setMotif] = useState('');
  const [notify, setNotify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const CONFIRM_KEYWORD = t('confirmKeyword').toUpperCase();

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setMotif('');
      setNotify(false);
      setConfirmText('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!user || !reason || confirmText !== CONFIRM_KEYWORD) return;
    setLoading(true);
    try {
      await onConfirm(user.id, reason, motif, notify);
      onClose();
    } catch (error) {
      console.error('Erreur bannissement:', error);
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
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            <IoBanOutline className="text-xl" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
              {t('title')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {t('description')}
            </p>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-2">
        {/* User Identity Header - compact */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700">
          {user.profilePictureUrl ? (
            <img 
              src={pip(user.profilePictureUrl)} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-xs">
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

        {/* Ban Reason Dropdown */}
        <div className="space-y-1">
          <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
            {t('reason')} <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors"
          >
            <option value="">{t('selectReason')}</option>
            {BAN_REASONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Detailed Evidence avec RichTextEditor */}
        {reason && (
          <div className="space-y-1">
            <label className="block text-slate-700 dark:text-slate-300 text-[10px] font-semibold uppercase tracking-wider">
              {t('evidence')}
            </label>
            
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
              <RichTextEditor
                value={motif}
                onChange={setMotif}
                placeholder={t('evidencePlaceholder')}
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
            label={t('notify')}
            message={t('notifyMessage', { email: user.email })}
            colorScheme="red"
          />
        </div>

        {/* Security Confirmation Input */}
        <div className="p-2 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg">
          <label className="block text-[10px] font-medium text-red-800 dark:text-red-300 mb-1">
            {t('confirmLabel')} <span className="font-bold underline">{CONFIRM_KEYWORD}</span>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-2 py-1 text-xs rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-red-500 focus:border-red-500 uppercase font-bold text-center tracking-widest"
            placeholder={CONFIRM_KEYWORD}
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
          onClick={handleConfirm}
          disabled={loading || !reason || confirmText !== CONFIRM_KEYWORD}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-1"
          type="button"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('processing')}
            </>
          ) : (
            t('confirm')
          )}
        </button>
      </div>
    </Modal>
  );
}