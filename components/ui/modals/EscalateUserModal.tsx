// components/modals/EscalateUserModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { User, EscalationLevel } from '@/lib/types/user';
import { useTranslations } from 'next-intl';
import { IoWarningOutline, IoPauseCircleOutline, IoBanOutline, IoArrowUpCircleOutline } from 'react-icons/io5';
import { MdFormatBold, MdFormatItalic, MdFormatListBulleted, MdFormatListNumbered, MdLink } from "react-icons/md";

const ESCALATION_LEVELS = [
  { level: 1, name: 'Avertissement', color: 'info', icon: IoWarningOutline, description: 'Premier avertissement' },
  { level: 2, name: 'Suspension', color: 'warning', icon: IoPauseCircleOutline, description: 'Suspension temporaire' },
  { level: 3, name: 'Bannissement', color: 'danger', icon: IoBanOutline, description: 'Bannissement définitif' },
];

interface EscalateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  currentLevel?: EscalationLevel;
  onEscalate: (userId: string, level: EscalationLevel, reason: string) => Promise<void>;
}

export default function EscalateUserModal({ 
  isOpen, 
  onClose, 
  user, 
  currentLevel = 0, // ✅ CHANGER 1 en 0
  onEscalate 
}: EscalateUserModalProps) {
  const t = useTranslations('admin.usersManagement.escalateModal');
  
  // ✅ Récupérer le niveau actuel depuis l'utilisateur (priorité à user?.escalationLevel)
  // Si user n'est pas disponible, utiliser currentLevel
  const userCurrentLevel = (user?.escalationLevel ?? currentLevel) as EscalationLevel;
  
  // ✅ Le prochain niveau disponible = niveau actuel + 1 (mais max 3)
  const nextAvailableLevel = Math.min(userCurrentLevel + 1, 3) as EscalationLevel;
  
  const [selectedLevel, setSelectedLevel] = useState<EscalationLevel>(nextAvailableLevel);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // ✅ Mettre à jour le niveau sélectionné quand l'utilisateur change
  useEffect(() => {
    if (user) {
      const nextLevel = Math.min((user.escalationLevel ?? 0) + 1, 3) as EscalationLevel;
      setSelectedLevel(nextLevel);
    }
  }, [user]);

  // ✅ Réinitialiser quand la modal se ferme
  useEffect(() => {
    if (isOpen && user) {
      console.log('📊 MODAL OUVERTE - User reçu:', {
        id: user.id,
        email: user.email,
        escalationLevel: user.escalationLevel,
        currentLevel: currentLevel
      });
    }
  }, [isOpen, user, currentLevel]);

  // ✅ Ajouter un log pour déboguer
  useEffect(() => {
    if (isOpen && user) {
      console.log('📊 EscalateModal - User:', {
        id: user.id,
        email: user.email,
        escalationLevel: user.escalationLevel,
        userCurrentLevel,
        nextAvailableLevel,
        selectedLevel
      });
    }
  }, [isOpen, user, userCurrentLevel, nextAvailableLevel, selectedLevel]);

  const handleEscalate = async () => {
    if (!user || !reason.trim()) return;
    setLoading(true);
    try {
      await onEscalate(user.id, selectedLevel, reason);
      onClose();
      setReason('');
    } catch (error) {
      console.error('Erreur escalade:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormat = (command: string) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let newText = text;
    let newCursorPos = end;
    
    switch(command) {
      case 'bold':
        newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
        newCursorPos = end + 4;
        break;
      case 'italic':
        newText = text.substring(0, start) + '*' + selectedText + '*' + text.substring(end);
        newCursorPos = end + 2;
        break;
      case 'insertUnorderedList':
        newText = text.substring(0, start) + '• ' + selectedText + text.substring(end);
        newCursorPos = end + 2;
        break;
      case 'insertOrderedList':
        newText = text.substring(0, start) + '1. ' + selectedText + text.substring(end);
        newCursorPos = end + 3;
        break;
      case 'link':
        const url = window.prompt('Entrez l\'URL:');
        if (url) {
          newText = text.substring(0, start) + '[' + selectedText + '](' + url + ')' + text.substring(end);
          newCursorPos = end + url.length + 4;
        }
        break;
    }
    
    setReason(newText);
    
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  if (!user) return null;

  const nextLevel = ESCALATION_LEVELS.find(l => l.level === selectedLevel);
  
  // ✅ Couleurs avec support dark mode
  const levelColors = {
    1: { 
      bg: 'bg-blue-50 dark:bg-blue-900/20', 
      border: 'border-blue-200 dark:border-blue-800', 
      text: 'text-blue-600 dark:text-blue-400', 
      button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700' 
    },
    2: { 
      bg: 'bg-amber-50 dark:bg-amber-900/20', 
      border: 'border-amber-200 dark:border-amber-800', 
      text: 'text-amber-600 dark:text-amber-400', 
      button: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700' 
    },
    3: { 
      bg: 'bg-red-50 dark:bg-red-900/20', 
      border: 'border-red-200 dark:border-red-800', 
      text: 'text-red-600 dark:text-red-400', 
      button: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700' 
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

  // ✅ Texte du niveau actuel
  const getCurrentLevelText = () => {
    if (userCurrentLevel === 0) return 'Aucune sanction';
    if (userCurrentLevel === 1) return 'Avertissement donné';
    if (userCurrentLevel === 2) return 'Suspension en cours';
    if (userCurrentLevel === 3) return 'Bannissement appliqué';
    return '';
  };

  // ✅ Texte du prochain niveau
  const getNextLevelText = () => {
    if (userCurrentLevel === 0) return 'Avertissement';
    if (userCurrentLevel === 1) return 'Suspension';
    if (userCurrentLevel === 2) return 'Bannissement';
    if (userCurrentLevel === 3) return 'Aucune (maximum atteint)';
    return '';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      title={
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-full">
            <IoArrowUpCircleOutline className="h-9.5 w-9.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('description')}
            </p>
          </div>
          {/* Status Badge - Affiche le niveau actuel */}
          <span 
            className={`px-4 py-1 text-[12px] font-semibold rounded-full ml-14 
              ${userCurrentLevel === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' : ''}
              ${levelBadges[userCurrentLevel as keyof typeof levelBadges]?.bg || ''} 
              ${levelBadges[userCurrentLevel as keyof typeof levelBadges]?.text || ''} 
              border ${levelBadges[userCurrentLevel as keyof typeof levelBadges]?.border || ''}`} 
            data-purpose="current-level-badge"
          >
            {userCurrentLevel === 0 && 'Nouveau'}
            {userCurrentLevel === 1 && t('warning')}
            {userCurrentLevel === 2 && t('suspension')}
            {userCurrentLevel === 3 && t('ban')}
          </span>
        </div>
      }
    >
      <div className="p-4 space-y-4">
        {/* User Identity Header */}
        <section className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700" data-purpose="user-identity">
          {user.profilePictureUrl ? (
            <img 
              src={user.profilePictureUrl} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary-400 font-bold text-sm">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
          </div>
          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded uppercase tracking-wider">
            NESTHUB
          </span>
        </section>

        {/* Section d'information sur le niveau */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Niveau actuel</p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {getCurrentLevelText()}
              </p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-blue-200 dark:bg-blue-700"></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Prochaine étape</p>
              <p className={`text-sm font-semibold ${userCurrentLevel >= 3 ? 'text-gray-400 dark:text-gray-500' : 
                userCurrentLevel === 0 ? 'text-blue-600 dark:text-blue-400' :
                userCurrentLevel === 1 ? 'text-amber-600 dark:text-amber-400' :
                userCurrentLevel === 2 ? 'text-red-600 dark:text-red-400' : ''}`}>
                {getNextLevelText()}
              </p>
            </div>
          </div>
          {userCurrentLevel >= 3 && (
            <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
              <span>⚠️</span> L'utilisateur a déjà atteint le niveau maximum.
            </p>
          )}
        </div>

        {/* Step Selection */}
        <section data-purpose="sanction-steps-selector">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('applySanction')}
          </label>
          <div className="grid grid-cols-1 gap-2">
            {ESCALATION_LEVELS.map(level => {
              const LevelIcon = level.icon;
              const isPast = level.level < userCurrentLevel;
              const isCurrent = level.level === userCurrentLevel;
              const isNext = level.level === userCurrentLevel + 1;
              const isLocked = level.level > userCurrentLevel + 1;
              const isSelected = selectedLevel === level.level;
              const colors = levelColors[level.level as keyof typeof levelColors];
              
              if (isPast) {
                // Niveaux déjà passés
                return (
                  <div key={level.level} className="flex items-center p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 cursor-not-allowed" data-purpose="step-past">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                      <svg className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-tight">{level.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500">{t('alreadyApplied')}</p>
                    </div>
                  </div>
                );
              } else if (isCurrent) {
                // Niveau actuel
                return (
                  <div key={level.level} className="flex items-center p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed" data-purpose="step-current">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-400 dark:bg-gray-600 text-white">
                      <span className="text-xs font-bold">{level.level}</span>
                    </div>
                    <div className="ml-3 flex-grow">
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-tight">{level.name}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-500">{t('currentLevel')}</p>
                    </div>
                  </div>
                );
              } else if (isNext) {
                // Prochain niveau disponible
                return (
                  <div 
                    key={level.level} 
                    className={`flex items-center p-2.5 rounded-lg border-2 transition-all cursor-pointer
                      ${isSelected ? colors.border : 'border-gray-300 dark:border-gray-600'} 
                      ${isSelected ? colors.bg : 'bg-white dark:bg-gray-800'} 
                      hover:border-gray-400 dark:hover:border-gray-500`}
                    onClick={() => setSelectedLevel(level.level as EscalationLevel)}
                    data-purpose="step-next"
                  >
                    <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full 
                      ${isSelected ? colors.button.split(' ')[0] : 'bg-gray-300 dark:bg-gray-600'} 
                      text-white`}>
                      <span className="text-xs font-bold">{level.level}</span>
                    </div>
                    <div className="ml-3 flex-grow">
                      <p className={`text-xs font-bold text-gray-900 dark:text-white uppercase tracking-tight`}>{level.name}</p>
                      <p className={`text-[10px] ${isSelected ? colors.text : 'text-gray-500 dark:text-gray-400'}`}>{level.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 ${isSelected ? colors.border : 'border-gray-300 dark:border-gray-600'}`}></div>
                    </div>
                  </div>
                );
              } else {
                // Niveaux futurs
                return (
                  <div key={level.level} className="flex items-center p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-50 cursor-not-allowed" data-purpose="step-locked">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path clipRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" fillRule="evenodd"></path>
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-tight">{level.name}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{t('locked')}</p>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </section>

        {/* Reason Input */}
        <section data-purpose="escalation-reason-input">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="reason">
            {t('reason')} <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary bg-white dark:bg-gray-800">
            {/* Toolbar */}
            <div className="flex items-center gap-0.5 p-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <button 
                onClick={() => handleFormat('bold')} 
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors" 
                title="Gras" 
                type="button"
              >
                <MdFormatBold className="text-xs" />
              </button>
              <button 
                onClick={() => handleFormat('italic')} 
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors" 
                title="Italique" 
                type="button"
              >
                <MdFormatItalic className="text-xs" />
              </button>
              <div className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
              <button 
                onClick={() => handleFormat('insertUnorderedList')} 
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors" 
                title="Liste à puces" 
                type="button"
              >
                <MdFormatListBulleted className="text-xs" />
              </button>
              <button 
                onClick={() => handleFormat('insertOrderedList')} 
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors" 
                title="Liste numérotée" 
                type="button"
              >
                <MdFormatListNumbered className="text-xs" />
              </button>
              <div className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
              <button 
                onClick={() => handleFormat('link')} 
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors" 
                title="Ajouter un lien" 
                type="button"
              >
                <MdLink className="text-xs" />
              </button>
            </div>
            {/* Text Area */}
            <textarea
              ref={editorRef}
              className="w-full border-none focus:ring-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-xs p-2 resize-none"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('reasonPlaceholder')}
              rows={3}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
            {t('historyNote')}
          </p>
        </section>
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all"
          type="button"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleEscalate}
          disabled={loading || !reason.trim() || userCurrentLevel >= 3}
          className={`px-4 py-2.5 text-xs font-semibold text-white 
            ${levelColors[selectedLevel as keyof typeof levelColors]?.button || 'bg-gray-400 dark:bg-gray-600'} 
            active:scale-[0.98] rounded-lg shadow-sm transition-all 
            disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
            flex items-center justify-center gap-2 min-w-[100px]`}
          type="button"
        >
          {loading ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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