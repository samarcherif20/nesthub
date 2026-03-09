// components/modals/WarningUserModal.tsx
'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { User } from '@/lib/types/user';
import { IoWarningOutline } from 'react-icons/io5';
import { useTranslations } from 'next-intl';

interface WarningUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: string, reason: string, motif: string, notify: boolean) => Promise<void>;
}

export default function WarningUserModal({ isOpen, onClose, user, onConfirm }: WarningUserModalProps) {
  const t = useTranslations('admin.usersManagement.warningModal');
  const [reason, setReason] = useState('');
  const [motif, setMotif] = useState('');
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);

  const WARNING_REASONS = [
    { value: 'INAPPROPRIATE_BEHAVIOR', label: t('reasons.inappropriateBehavior.label'), description: t('reasons.inappropriateBehavior.description') },
    { value: 'SPAM', label: t('reasons.spam.label'), description: t('reasons.spam.description') },
    { value: 'FALSE_INFORMATION', label: t('reasons.falseInformation.label'), description: t('reasons.falseInformation.description') },
    { value: 'PAYMENT_ISSUES', label: t('reasons.paymentIssues.label'), description: t('reasons.paymentIssues.description') },
    { value: 'MULTIPLE_ACCOUNTS', label: t('reasons.multipleAccounts.label'), description: t('reasons.multipleAccounts.description') },
    { value: 'OTHER', label: t('reasons.other.label'), description: t('reasons.other.description') },
  ];

  const handleConfirm = async () => {
    if (!user || !reason) return;
    setLoading(true);
    try {
      await onConfirm(user.id, reason, motif, notify);
      onClose();
      // Reset
      setReason('');
      setMotif('');
      setNotify(true);
    } catch (error) {
      console.error(t('error'), error);
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
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-13 h-13 rounded-full bg-orange-100 text-orange-600">
            <IoWarningOutline className="text-4xl" />
          </div>
          <div className="flex flex-col">
            <span className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight">
              {t('title')}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs">
              {t('description')}
            </span>
          </div>
        </div>
      }
    >
      {/* Contenu plus compact */}
      <div className="p-4 space-y-2">
        {/* Informations utilisateur compactes */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50/50 border border-orange-100">
          {user.profilePictureUrl ? (
            <img 
              src={user.profilePictureUrl} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full object-cover border border-orange-200"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-slate-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-500">{t('reliability')}</p>
            <p className="text-sm font-semibold text-orange-600">{user.reliabilityScore || 0}%</p>
          </div>
        </div>

        {/* Sélection de la raison en grille 2 colonnes */}
        <div className="space-y-2">
          <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
            {t('reason')} <span className="text-red-500">*</span>
          </label>
          
          <div className="grid grid-cols-2 gap-2">
            {WARNING_REASONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setReason(option.value)}
                className={`w-full p-2 rounded-lg border text-left transition-all ${
                  reason === option.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-slate-200 hover:border-orange-300 bg-white'
                }`}
              >
                <p className="font-medium text-xs text-slate-900">{option.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-tight">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Message personnalisé plus compact */}
        {reason && (
          <div className="space-y-1.5">
            <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider">
              {reason === 'OTHER' ? t('specifyReason') : t('optionalMessage')}
            </label>
            
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder={reason === 'OTHER' ? t('explainReason') : t('additionalDetails')}
              className="w-full p-2 text-sm rounded-lg border border-slate-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none resize-none bg-white"
              rows={1}
            />
          </div>
        )}

        {/* Options de notification compactes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-700 select-none">
              {t('notifyByEmail')}
            </span>
          </label>

          {/* Message d'information compact */}
          <div className="p-2 rounded-lg bg-orange-50 border border-orange-200">
            <p className="text-xs text-orange-700 flex items-start gap-1.5">
              <IoWarningOutline className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                {t('infoMessage')}
                {notify && ` ${t('emailSent')}`}
                {user.escalationLevel && user.escalationLevel > 1 && (
                  <span className="block mt-1 font-medium">
                    ⚠️ {t('previousWarnings', { count: user.escalationLevel - 1 })}
                  </span>
                )}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Footer compact */}
      <div className="p-4 bg-slate-50 flex justify-end gap-2 border-t border-slate-100">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-300 transition-colors"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading || !reason}
          className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 shadow-sm shadow-orange-600/20 transition-all disabled:opacity-50"
        >
          {loading ? t('processing') : t('send')}
        </button>
      </div>
    </Modal>
  );
}