// components/modals/SuspendUserModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { User } from '@/lib/types/user';
import { useTranslations } from 'next-intl';
import { IoPauseCircleOutline } from 'react-icons/io5';
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatListBulleted, MdFormatListNumbered, MdLink, MdFormatClear } from "react-icons/md";

interface SuspendUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: string, duration: number, reason: string, motif: string, notify: boolean) => Promise<void>;
}

export default function SuspendUserModal({ isOpen, onClose, user, onConfirm }: SuspendUserModalProps) {
  const t = useTranslations('admin.usersManagement.suspendModal');
  const [duration, setDuration] = useState(7);
  const [reason, setReason] = useState('');
  const [motif, setMotif] = useState('');
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleConfirm = async () => {
    if (!user || !reason) return;
    setLoading(true);
    try {
      await onConfirm(user.id, duration, reason, motif, notify);
      onClose();
      // Réinitialiser
      setDuration(7);
      setReason('');
      setMotif('');
      setNotify(true);
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error('Erreur suspension:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setMotif(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setMotif(editorRef.current.innerHTML);
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
      setMotif('');
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
          <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full">
            <IoPauseCircleOutline className="h-9.5 w-9.5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('description')}
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
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm">
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

        {/* Duration Selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t('duration')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 7, 30].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  duration === d
                    ? 'border-2 border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                    : 'border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-800 bg-white dark:bg-gray-800'
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    duration === d ? 'text-orange-600' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {d === 1 ? t('day', { count: 1 }) : d === 7 ? t('days', { count: 7 }) : t('days', { count: 30 })}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Reason Form */}
        <form className="space-y-3" id="suspend-form">
          {/* Reason Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300" htmlFor="suspend-reason">
              {t('reason')} <span className="text-red-500">*</span>
            </label>
            <select
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-orange-500 focus:ring focus:ring-orange-200 dark:focus:ring-orange-900/30 transition-colors h-9 text-sm px-2"
            >
              <option value="">{t('selectReason')}</option>
              <option value="spam">{t('reasons.spam')}</option>
              <option value="tos">{t('reasons.tos')}</option>
              <option value="safety">{t('reasons.safety')}</option>
              <option value="other">{t('reasons.other')}</option>
            </select>
          </div>

          {/* Detailed Motif Editor */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300" htmlFor="rich-editor">
              {t('details')}
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus-within:ring-1 focus-within:ring-orange-200 dark:focus-within:ring-orange-900/30 focus-within:border-orange-500 transition-all">
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
                className="min-h-[80px] p-2 text-xs text-gray-900 dark:text-white outline-none prose prose-sm dark:prose-invert max-w-none"
                data-placeholder={t('detailsPlaceholder')}
              />
            </div>
          </div>

          {/* Notification Checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notify-email"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-offset-0"
            />
            <label htmlFor="notify-email" className="text-xs text-gray-700 dark:text-gray-300">
              {t('notify')}
            </label>
          </div>
        </form>
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
          onClick={handleConfirm}
          disabled={loading || !reason}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] rounded-lg shadow-sm shadow-orange-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          type="button"
        >
          {loading ? t('processing') : t('confirm')}
        </button>
      </div>
    </Modal>
  );
}