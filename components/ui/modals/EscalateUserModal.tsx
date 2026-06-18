// components/modals/EscalateUserModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import RichTextEditor from '@/components/ui/editor/RichTextEditor';
import NotificationCheckbox from "@/components/ui/NotificationCheckbox";
import { User, EscalationLevel } from '@/lib/types/user';
import { useTranslations } from 'next-intl';
import { IoWarningOutline, IoPauseCircleOutline, IoBanOutline, IoArrowUpCircleOutline } from 'react-icons/io5';

const pip = (url: string) =>
  `/api/admin/serve-image?url=${encodeURIComponent(url)}`;

interface EscalateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentLevel?: EscalationLevel;
  onEscalate: (userId: string, level: EscalationLevel, reason: string, notify: boolean) => Promise<void>;
}

export default function EscalateUserModal({ 
  isOpen, 
  onClose, 
  user, 
  currentLevel = 0,
  onEscalate 
}: EscalateUserModalProps) {
  const t = useTranslations('admin.usersManagement.escalateModal');
  
  const userCurrentLevel = (user?.escalationLevel ?? currentLevel) as EscalationLevel;
  const nextAvailableLevel = Math.min(userCurrentLevel + 1, 3) as EscalationLevel;
  
  const [selectedLevel, setSelectedLevel] = useState<EscalationLevel>(nextAvailableLevel);
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(false);
  const [loading, setLoading] = useState(false);

  const ESCALATION_LEVELS = [
    { level: 1, name: t('levels.warning'), color: 'info', icon: IoWarningOutline, description: t('levels.warningDesc') },
    { level: 2, name: t('levels.suspension'), color: 'warning', icon: IoPauseCircleOutline, description: t('levels.suspensionDesc') },
    { level: 3, name: t('levels.ban'), color: 'danger', icon: IoBanOutline, description: t('levels.banDesc') },
  ];

  useEffect(() => {
    if (user) {
      const nextLevel = Math.min((user.escalationLevel ?? 0) + 1, 3) as EscalationLevel;
      setSelectedLevel(nextLevel);
    }
  }, [user]);

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setReason('');
      setNotify(false);
      setLoading(false);
    }
  }, [isOpen]);

  const handleEscalate = async () => {
    if (!user || !reason.trim()) return;
    setLoading(true);
    try {
      await onEscalate(user.id, selectedLevel, reason, notify);
      onClose();
    } catch (error) {
      console.error('Erreur escalade:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const nextLevel = ESCALATION_LEVELS.find(l => l.level === selectedLevel);
  
  const levelColors = {
    1: { 
      bg: 'bg-blue-50 dark:bg-blue-900/20', 
      border: 'border-blue-200 dark:border-blue-800', 
      text: 'text-blue-600 dark:text-blue-400', 
      button: 'bg-blue-600 hover:bg-blue-700' 
    },
    2: { 
      bg: 'bg-amber-50 dark:bg-amber-900/20', 
      border: 'border-amber-200 dark:border-amber-800', 
      text: 'text-amber-600 dark:text-amber-400', 
      button: 'bg-amber-600 hover:bg-amber-700' 
    },
    3: { 
      bg: 'bg-red-50 dark:bg-red-900/20', 
      border: 'border-red-200 dark:border-red-800', 
      text: 'text-red-600 dark:text-red-400', 
      button: 'bg-red-600 hover:bg-red-700' 
    },
  };

  const levelBadges = {
    1: { 
      bg: 'bg-blue-50 dark:bg-blue-900/30', 
      text: 'text-blue-600 dark:text-blue-400', 
      border: 'border-blue-200 dark:border-blue-800' 
    },
    2: { 
      bg: 'bg-amber-50 dark:bg-amber-900/30', 
      text: 'text-amber-600 dark:text-amber-400', 
      border: 'border-amber-200 dark:border-amber-800' 
    },
    3: { 
      bg: 'bg-red-50 dark:bg-red-900/30', 
      text: 'text-red-600 dark:text-red-400', 
      border: 'border-red-200 dark:border-red-800' 
    },
  };

  const getCurrentLevelText = () => {
    if (userCurrentLevel === 0) return t('current.none');
    if (userCurrentLevel === 1) return t('current.warning');
    if (userCurrentLevel === 2) return t('current.suspension');
    if (userCurrentLevel === 3) return t('current.ban');
    return '';
  };

  const getNextLevelText = () => {
    if (userCurrentLevel === 0) return t('next.warning');
    if (userCurrentLevel === 1) return t('next.suspension');
    if (userCurrentLevel === 2) return t('next.ban');
    if (userCurrentLevel === 3) return t('next.maxReached');
    return '';
  };

  const getCheckboxColorScheme = () => {
    if (selectedLevel === 1) return "blue";
    if (selectedLevel === 2) return "yellow";
    if (selectedLevel === 3) return "red";
    return "blue";
  };

 const getNotificationMessage = (level: string, email?: string) => {
  const emailValue = email || "l'utilisateur";
  switch (level) {
    case "warning":
      return t("notifyMessages.warning", { email: emailValue });
    case "suspension":
      return t("notifyMessages.suspension", { email: emailValue });
    case "ban":
      return t("notifyMessages.ban", { email: emailValue });
    default:
      return t("notifyMessages.default", { email: emailValue });
  }
};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      className="max-w-2xl"
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <IoArrowUpCircleOutline className="text-xl" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-slate-900 dark:text-white text-sm font-bold leading-tight">
              {t('title')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {t('description')}
            </p>
          </div>
          <span 
            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap ml-2
              ${userCurrentLevel === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700' : ''}
              ${levelBadges[userCurrentLevel as keyof typeof levelBadges]?.bg || ''} 
              ${levelBadges[userCurrentLevel as keyof typeof levelBadges]?.text || ''} 
              border ${levelBadges[userCurrentLevel as keyof typeof levelBadges]?.border || ''}`}
          >
            {userCurrentLevel === 0 && t('badge.new')}
            {userCurrentLevel === 1 && t('badge.warning')}
            {userCurrentLevel === 2 && t('badge.suspension')}
            {userCurrentLevel === 3 && t('badge.ban')}
          </span>
        </div>
      }
    >
      <div className="p-4 space-y-2">
        {/* User Identity Header - compact */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700">
          {user.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={pip(user.profilePictureUrl)} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
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

        {/* Section d'information sur le niveau - compact */}
        <div className={`p-2 rounded-lg border ${levelColors[selectedLevel as keyof typeof levelColors]?.bg || 'bg-blue-50 dark:bg-blue-900/10'} ${levelColors[selectedLevel as keyof typeof levelColors]?.border || 'border-blue-200 dark:border-blue-800'}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">{t('currentLevelLabel')}</p>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                {getCurrentLevelText()}
              </p>
            </div>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <div>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">{t('nextStepLabel')}</p>
              <p className={`text-xs font-semibold ${userCurrentLevel >= 3 ? 'text-gray-400' : levelColors[selectedLevel as keyof typeof levelColors]?.text || 'text-blue-600 dark:text-blue-400'}`}>
                {getNextLevelText()}
              </p>
            </div>
          </div>
          {userCurrentLevel >= 3 && (
            <p className="text-[9px] text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
              {t('maxLevelReached')}
            </p>
          )}
        </div>

        {/* Step Selection - compact */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            {t('applySanction')}
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {ESCALATION_LEVELS.map(level => {
              const isPast = level.level < userCurrentLevel;
              const isCurrent = level.level === userCurrentLevel;
              const isNext = level.level === userCurrentLevel + 1;
              const isLocked = level.level > userCurrentLevel + 1;
              const isSelected = selectedLevel === level.level;
              const colors = levelColors[level.level as keyof typeof levelColors];
              
              if (isPast) {
                return (
                  <div key={level.level} className="flex items-center p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-tight">{level.name}</p>
                      <p className="text-[8px] text-gray-500 dark:text-gray-500">{t('alreadyApplied')}</p>
                    </div>
                  </div>
                );
              } else if (isCurrent) {
                return (
                  <div key={level.level} className="flex items-center p-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-400 dark:bg-gray-600 text-white">
                      <span className="text-[9px] font-bold">{level.level}</span>
                    </div>
                    <div className="ml-2 flex-grow">
                      <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{level.name}</p>
                      <p className="text-[8px] text-gray-500 dark:text-gray-500">{t('currentLevel')}</p>
                    </div>
                  </div>
                );
              } else if (isNext) {
                return (
                  <div 
                    key={level.level} 
                    className={`flex items-center p-1.5 rounded-lg border transition-all cursor-pointer
                      ${isSelected ? colors.border : 'border-gray-300 dark:border-gray-600'} 
                      ${isSelected ? colors.bg : 'bg-white dark:bg-gray-900'} 
                      hover:border-gray-400 dark:hover:border-gray-500`}
                    onClick={() => setSelectedLevel(level.level as EscalationLevel)}
                  >
                    <div className={`flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full 
                      ${isSelected ? colors.button.split(' ')[0] : 'bg-gray-300 dark:bg-gray-600'} 
                      text-white`}>
                      <span className="text-[9px] font-bold">{level.level}</span>
                    </div>
                    <div className="ml-2 flex-grow">
                      <p className={`text-[10px] font-bold text-gray-900 dark:text-white uppercase tracking-tight`}>{level.name}</p>
                      <p className={`text-[8px] ${isSelected ? colors.text : 'text-gray-500 dark:text-gray-400'}`}>{level.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 ${isSelected ? colors.border : 'border-gray-300 dark:border-gray-600'}`}></div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div key={level.level} className="flex items-center p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 opacity-50 cursor-not-allowed">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      <svg className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" fillRule="evenodd"></path>
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{level.name}</p>
                      <p className="text-[8px] text-gray-400 dark:text-gray-500">{t('locked')}</p>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>

        {/* Reason Input avec RichTextEditor */}
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
          
          <p className="text-[8px] text-slate-500 dark:text-slate-400">
            {t('historyNote')}
          </p>
        </div>

        {/* Notification Checkbox */}
        <div className="pt-1">
          <NotificationCheckbox
            notify={notify}
            setNotify={setNotify}
            userEmail={user.email}
            label={t('notify')}
message={getNotificationMessage(selectedLevel === 1 ? "warning" : selectedLevel === 2 ? "suspension" : "ban", user?.email)}
            colorScheme={getCheckboxColorScheme()}
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
          onClick={handleEscalate}
          disabled={loading || !reason.trim() || userCurrentLevel >= 3}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1
            ${levelColors[selectedLevel as keyof typeof levelColors]?.button || 'bg-gray-400'}`}
          type="button"
        >
          {loading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('processing')}</span>
            </>
          ) : (
            t('apply')
          )}
        </button>
      </div>
    </Modal>
  );
}