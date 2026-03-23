// components/modals/AddNoteModal.tsx
'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import RichTextEditor from '@/components/ui/editor/RichTextEditor';
import { User } from '@/lib/types/user';
import { useTranslations } from 'next-intl';
import { RiStickyNoteAddLine } from "react-icons/ri";
import { IoCloseOutline } from 'react-icons/io5';

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
  const [charCount, setCharCount] = useState(0);

  // Reset quand le modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setContent('');
      setCharCount(0);
      setLoading(false);
    }
  }, [isOpen]);

  // Mettre à jour le compteur de caractères (texte brut sans HTML)
  const handleContentChange = (html: string) => {
    setContent(html);
    
    // Compter uniquement le texte brut (sans les balises HTML)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    setCharCount(text.length);
  };

  const handleAddNote = async () => {
    if (!user || !content.trim() || charCount === 0) return;
    
    setLoading(true);
    try {
      await onAddNote(user.id, content);
      onClose();
    } catch (error) {
      console.error('Erreur ajout note:', error);
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
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
            <RiStickyNoteAddLine className="text-xl" />
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
      <div className="space-y-3">
        {/* User Info Section - même taille que l'original */}
        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-700">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.profilePictureUrl ? (
              <img 
                src={user.profilePictureUrl} 
                alt={`${user.firstName} ${user.lastName}`}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-xs text-slate-900 dark:text-white truncate">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
          </div>

          {/* Role Badge */}
          <span className="text-[8px] font-medium px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-200 dark:border-indigo-800 uppercase whitespace-nowrap">
            {user.role || 'USER'}
          </span>
        </div>

        {/* Rich Text Editor - même hauteur que l'original */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-semibold text-slate-700 dark:text-slate-300">
              {t('noteContent')} <span className="text-red-500">*</span>
            </label>
            
            {/* Character Counter */}
            <span className={`text-[9px] font-medium ${
              charCount >= MAX_CHARS - 50 
                ? 'text-orange-500 dark:text-orange-400' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              {charCount}/{MAX_CHARS}
            </span>
          </div>

          {/* RichTextEditor Component - avec hauteur limitée comme l'original */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <RichTextEditor
              value={content}
              onChange={handleContentChange}
              placeholder={t('placeholder')}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions - même style que l'original */}
      <div className="flex flex-col sm:flex-row-reverse gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={handleAddNote}
          disabled={loading || !content.trim() || charCount === 0}
          className="inline-flex justify-center items-center px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('adding')}
            </span>
          ) : (
            t('addNote')
          )}
        </button>
        <button
          onClick={onClose}
          className="inline-flex justify-center items-center px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          <IoCloseOutline className="text-sm mr-1" />
          {t('cancel')}
        </button>
      </div>
    </Modal>
  );
}