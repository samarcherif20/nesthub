// components/modals/BanUserModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { User } from '@/lib/types/user';
import { useTranslations } from 'next-intl';
import { IoBanOutline } from 'react-icons/io5';
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatListBulleted, MdFormatListNumbered, MdLink, MdImage } from "react-icons/md";

interface BanUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onConfirm: (userId: string, reason: string, motif: string) => Promise<void>;
}

const BAN_REASONS = [
  { value: 'SPAM', label: 'Spam / Publicité' },
  { value: 'HARASSMENT', label: 'Harcèlement' },
  { value: 'TOS_VIOLATION', label: 'Violation des conditions d\'utilisation' },
  { value: 'FRAUD', label: 'Fraude ou tentative de phishing' },
  { value: 'IDENTITY_THEFT', label: 'Usurpation d\'identité' },
  { value: 'MULTIPLE_WARNINGS', label: 'Avertissements multiples ignorés' },
  { value: 'ILLEGAL_ACTIVITY', label: 'Activité illégale' },
  { value: 'OTHER', label: 'Autre raison' },
];

export default function BanUserModal({ isOpen, onClose, user, onConfirm }: BanUserModalProps) {
  const t = useTranslations('admin.usersManagement.banModal');
  const [reason, setReason] = useState('');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  const handleConfirm = async () => {
    if (!user || !reason || confirmText !== 'BANNIR') return;
    setLoading(true);
    try {
      await onConfirm(user.id, reason, motif);
      onClose();
      setReason('');
      setMotif('');
      setConfirmText('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error('Erreur bannissement:', error);
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
    const selection = window.getSelection();
    const url = window.prompt('Entrez l\'URL du lien:');
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
          <div className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
            <IoBanOutline className="h-9.5 w-9.5 text-red-600" />
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
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
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

        {/* Ban Reason Form */}
        <form className="space-y-3" id="ban-form">
          {/* Reason Dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300" htmlFor="ban-reason">
              {t('reason')} <span className="text-red-500">*</span>
            </label>
            <select
              id="ban-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring focus:ring-red-200 dark:focus:ring-red-900/30 transition-colors h-9 text-sm px-2"
            >
              <option value="">{t('selectReason')}</option>
              {BAN_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Detailed Evidence Textarea */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300" htmlFor="rich-editor">
              {t('evidence')}
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm focus-within:ring-1 focus-within:ring-red-200 dark:focus-within:ring-red-900/30 focus-within:border-red-500 transition-all">
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
                  onClick={() => {
                    const url = window.prompt('Entrez l\'URL de l\'image:');
                    if (url) {
                      handleFormat('insertHTML', `<img src="${url}" alt="image" class="max-w-full h-auto my-1 rounded" />`);
                    }
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300 transition-colors"
                  title="Image"
                  type="button"
                >
                  <MdImage className="text-base" />
                </button>
              </div>

              {/* Content Editable Area */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                onPaste={handlePaste}
                className="min-h-[100px] p-2 text-xs text-gray-900 dark:text-white outline-none prose prose-sm dark:prose-invert max-w-none"
                data-placeholder={t('evidencePlaceholder')}
              />
            </div>
          </div>

          {/* Security Confirmation Input */}
          <div className="flex flex-col gap-1 p-3 border border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <label className="text-xs font-medium text-red-800 dark:text-red-300" htmlFor="confirm-text">
              {t('confirmLabel')} <span className="font-bold underline">BANNIR</span>
            </label>
            <input
              id="confirm-text"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="block w-full rounded-lg border-red-200 dark:border-red-800 dark:bg-gray-800 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 uppercase font-bold text-center tracking-widest placeholder:opacity-50 h-8 text-sm px-2"
              placeholder="BANNIR"
            />
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
          disabled={loading || !reason || confirmText !== 'BANNIR'}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          type="button"
        >
          {loading ? t('processing') : t('confirm')}
        </button>
      </div>
    </Modal>
  );
}