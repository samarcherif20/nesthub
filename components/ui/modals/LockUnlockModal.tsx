// components/modals/LockUnlockModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { User } from '@/lib/types/user';
import { useTranslations } from 'next-intl';
import { IoLockClosedOutline, IoLockOpenOutline } from 'react-icons/io5';
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatListBulleted, MdFormatListNumbered, MdLink, MdFormatClear } from "react-icons/md";

interface LockUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLock: (userId: string, reason: string) => Promise<void>;
  onUnlock: (userId: string) => Promise<void>;
}

export default function LockUnlockModal({ isOpen, onClose, user, onLock, onUnlock }: LockUnlockModalProps) {
  const t = useTranslations('admin.usersManagement.lockUnlockModal');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const isLocked = user?.status === 'LOCKED';

  const handleAction = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isLocked) {
        await onUnlock(user.id);
      } else {
        if (!reason) return;
        await onLock(user.id, reason);
      }
      onClose();
      setReason('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setReason(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setReason(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleLinkClick = () => {
    const url = window.prompt(t('enterLinkUrl'));
    if (url) {
      let formattedUrl = url;
      if (!url.match(/^https?:\/\//i)) {
        formattedUrl = 'https://' + url;
      }
      handleFormat('createLink', formattedUrl);
    }
  };

  // Reset editor when modal closes
  useEffect(() => {
    if (!isOpen && editorRef.current) {
      editorRef.current.innerHTML = '';
      setReason('');
    }
  }, [isOpen]);

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      title={
        <div className="flex items-center gap-3">
          <div className={`p-1.5 ${isLocked ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-violet-100 dark:bg-violet-900/30'} rounded-full`}>
            {isLocked ? (
              <IoLockOpenOutline className={`h-5 w-5 ${isLocked ? 'text-indigo-600' : 'text-violet-600'}`} />
            ) : (
              <IoLockClosedOutline className={`h-5 w-5 ${isLocked ? 'text-indigo-600' : 'text-violet-600'}`} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isLocked ? t('unlockTitle') : t('lockTitle')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isLocked ? t('unlockDescription') : t('lockDescription')}
            </p>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-4">
        {/* User Identity Header */}
        <section className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          {user.profilePictureUrl ? (
            <img 
              src={user.profilePictureUrl} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 object-cover"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${isLocked ? 'bg-indigo-100' : 'bg-violet-100'} flex items-center justify-center ${isLocked ? 'text-indigo-600' : 'text-violet-600'} font-bold text-sm`}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded uppercase tracking-wider">
            NESTHUB
          </span>
        </section>

        {/* Tentatives échouées (seulement si bloqué) */}
        {isLocked && (
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs font-medium text-indigo-800 dark:text-indigo-300">
              {t('failedAttempts')}: <span className="font-bold">{user.loginAttempts || 0}</span>
            </p>
          </div>
        )}

        {/* Raison (seulement pour blocage) */}
        {!isLocked && (
          <form className="space-y-3" id="lock-form">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300" htmlFor="lock-reason">
                {t('reason')} <span className="text-red-500">*</span>
              </label>
              <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus-within:ring-1 focus-within:ring-violet-200 dark:focus-within:ring-violet-900/30 focus-within:border-violet-500 transition-all">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 p-1 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <button
                    onClick={() => handleFormat('bold')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Gras"
                    type="button"
                  >
                    <MdFormatBold className="text-base" />
                  </button>
                  <button
                    onClick={() => handleFormat('italic')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Italique"
                    type="button"
                  >
                    <MdFormatItalic className="text-base" />
                  </button>
                  <button
                    onClick={() => handleFormat('underline')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Souligné"
                    type="button"
                  >
                    <MdFormatUnderlined className="text-base" />
                  </button>
                  
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
                  
                  <button
                    onClick={() => handleFormat('insertUnorderedList')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Liste à puces"
                    type="button"
                  >
                    <MdFormatListBulleted className="text-base" />
                  </button>
                  <button
                    onClick={() => handleFormat('insertOrderedList')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Liste numérotée"
                    type="button"
                  >
                    <MdFormatListNumbered className="text-base" />
                  </button>
                  
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>
                  
                  <button
                    onClick={handleLinkClick}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Lien"
                    type="button"
                  >
                    <MdLink className="text-base" />
                  </button>
                  <button
                    onClick={() => handleFormat('removeFormat')}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                    title="Effacer le formatage"
                    type="button"
                  >
                    <MdFormatClear className="text-base" />
                  </button>
                </div>

                {/* Content Editable Area */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  onPaste={handlePaste}
                  className="min-h-[100px] p-2 text-xs text-gray-900 dark:text-white outline-none prose prose-sm dark:prose-invert max-w-none"
                  data-placeholder={t('reasonPlaceholder')}
                />
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Modal Footer */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex flex-col-reverse sm:flex-row justify-end gap-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onClose}
          className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-all"
          type="button"
        >
          {t('cancel')}
        </button>
        <button
          onClick={handleAction}
          disabled={loading || (!isLocked && !reason)}
          className={`px-4 py-2.5 text-xs font-semibold text-white ${
            isLocked 
              ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' 
              : 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20'
          } active:scale-[0.98] rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`}
          type="button"
        >
          {loading ? t('processing') : isLocked ? t('unlock') : t('lock')}
        </button>
      </div>
    </Modal>
  );
}