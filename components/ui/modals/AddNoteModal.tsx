// components/modals/AddNoteModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { User } from '@/lib/types/user';
import { useTranslations } from 'next-intl';
import { RiStickyNoteAddLine } from "react-icons/ri";
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdFormatListBulleted, MdFormatListNumbered, MdLink, MdFormatClear } from "react-icons/md";

interface AddNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onAddNote: (userId: string, content: string) => Promise<void>;
}

const MAX_CHARS = 500;

export default function AddNoteModal({ isOpen, onClose, user, onAddNote }: AddNoteModalProps) {
  const t = useTranslations('admin.usersManagement.addNoteModal');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  const handleAddNote = async () => {
    if (!user || !content.trim()) return;
    setLoading(true);
    try {
      await onAddNote(user.id, content);
      onClose();
      setContent('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } catch (error) {
      console.error('Erreur ajout note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormat = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleLinkClick = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      const url = window.prompt(t('enterLinkUrl'));
      if (url) {
        let formattedUrl = url;
        if (!url.match(/^https?:\/\//i)) {
          formattedUrl = 'https://' + url;
        }
        handleFormat('createLink', formattedUrl);
      }
      return;
    }
    
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
      setContent('');
    }
  }, [isOpen]);

  if (!user) return null;

  const charCount = content.replace(/<[^>]*>/g, '').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={true}
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-13 h-13 rounded-full bg-indigo-600/20 text-primary">
            <RiStickyNoteAddLine className="text-4xl text-indigo-700" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight">
              {t('title')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {t('description')}
            </p>
          </div>
        </div>
      }
    >
      <div className="p-4 space-y-4">
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

        {/* Rich Text Editor */}
        <div className="space-y-2">
          <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold">
            {t('noteContent')} <span className="text-red-500">*</span>
          </label>

          <div className="relative">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-0.5 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg border border-slate-200 dark:border-slate-700 border-b-0">
              <button
                onClick={() => handleFormat('bold')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Gras"
                type="button"
              >
                <MdFormatBold className="text-base" />
              </button>
              <button
                onClick={() => handleFormat('italic')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Italique"
                type="button"
              >
                <MdFormatItalic className="text-base" />
              </button>
              <button
                onClick={() => handleFormat('underline')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Souligné"
                type="button"
              >
                <MdFormatUnderlined className="text-base" />
              </button>
              
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5 self-center"></div>
              
              <button
                onClick={() => handleFormat('insertUnorderedList')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Liste à puces"
                type="button"
              >
                <MdFormatListBulleted className="text-base" />
              </button>
              <button
                onClick={() => handleFormat('insertOrderedList')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Liste numérotée"
                type="button"
              >
                <MdFormatListNumbered className="text-base" />
              </button>
              
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-0.5 self-center"></div>
              
              <button
                onClick={handleLinkClick}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Insérer un lien"
                type="button"
              >
                <MdLink className="text-base" />
              </button>
              <button
                onClick={() => handleFormat('removeFormat')}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors ml-auto"
                title="Effacer le formatage"
                type="button"
              >
                <MdFormatClear className="text-base" />
              </button>
            </div>

            {/* Editable Area */}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleEditorInput}
              onPaste={handlePaste}
              data-placeholder={t('placeholder')}
              className="w-full min-h-[100px] p-2 text-xs rounded-b-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-transparent outline-none transition-all overflow-y-auto"
              style={{ whiteSpace: 'pre-wrap' }}
            />

            {/* Character Counter */}
            <div className="flex justify-end mt-2">
              <span className={`text-xs font-medium ${
                charCount >= MAX_CHARS - 50 
                  ? 'text-orange-500' 
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {charCount}/{MAX_CHARS}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row-reverse gap-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleAddNote}
          disabled={loading || !content.trim()}
          className="inline-flex justify-center items-center px-4 py-2.5 rounded-xl bg-indigo-700 text-white font-semibold text-xs hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('adding') : t('addNote')}
        </button>
        <button
          onClick={onClose}
          className="inline-flex justify-center items-center px-4 py-2.5  rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          {t('cancel')}
        </button>
      </div>
    </Modal>
  );
}