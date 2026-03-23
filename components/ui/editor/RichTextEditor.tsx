// components/ui/editor/RichTextEditor.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { getExtensions } from "./extensions";
import LinkModal from "./LinkModal";
import ImageModal from "./ImageModal";
import {
  TbBold,
  TbItalic,
  TbUnderline,
  TbList,
  TbListNumbers,
  TbLink,
  TbPhoto,
  TbCode,
  TbBlockquote,
  TbClearFormatting,
  TbArrowBackUp,
  TbArrowForwardUp,
} from "react-icons/tb";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean; // Nouvelle prop pour version compacte
}

const Toolbar = ({
  editor,
  onLinkClick,
  onImageClick,
  compact = false,
}: {
  editor: any;
  onLinkClick: () => void;
  onImageClick: () => void;
  compact?: boolean;
}) => {
  if (!editor) return null;

  const iconSize = compact ? "text-sm" : "text-lg";
  const buttonPadding = compact ? "p-1" : "p-1.5";

  return (
    <div className={`flex-shrink-0 flex flex-wrap items-center gap-0.5 p-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 ${compact ? "p-1" : "p-2"}`}>
      {/* Undo/Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30`}
        title="Annuler"
      >
        <TbArrowBackUp className={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30`}
        title="Rétablir"
      >
        <TbArrowForwardUp className={iconSize} />
      </button>

      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Formatage texte */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
          editor.isActive("bold") 
            ? "bg-primary text-white" 
            : "text-slate-600 dark:text-slate-400"
        }`}
        title="Gras"
      >
        <TbBold className={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
          editor.isActive("italic") 
            ? "bg-primary text-white" 
            : "text-slate-600 dark:text-slate-400"
        }`}
        title="Italique"
      >
        <TbItalic className={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
          editor.isActive("underline") 
            ? "bg-primary text-white" 
            : "text-slate-600 dark:text-slate-400"
        }`}
        title="Souligné"
      >
        <TbUnderline className={iconSize} />
      </button>

      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Listes */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
          editor.isActive("bulletList") 
            ? "bg-primary text-white" 
            : "text-slate-600 dark:text-slate-400"
        }`}
        title="Liste à puces"
      >
        <TbList className={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
          editor.isActive("orderedList") 
            ? "bg-primary text-white" 
            : "text-slate-600 dark:text-slate-400"
        }`}
        title="Liste numérotée"
      >
        <TbListNumbers className={iconSize} />
      </button>

      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Liens et médias */}
      <button
        onClick={onLinkClick}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
          editor.isActive("link") 
            ? "bg-primary text-white" 
            : "text-slate-600 dark:text-slate-400"
        }`}
        title="Lien"
      >
        <TbLink className={iconSize} />
      </button>
      <button
        onClick={onImageClick}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400`}
        title="Image"
      >
        <TbPhoto className={iconSize} />
      </button>

      {/* Code et citation */}
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
          editor.isActive("codeBlock") 
            ? "bg-primary text-white" 
            : "text-slate-600 dark:text-slate-400"
        }`}
        title="Code"
      >
        <TbCode className={iconSize} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
          editor.isActive("blockquote") 
            ? "bg-primary text-white" 
            : "text-slate-600 dark:text-slate-400"
        }`}
        title="Citation"
      >
        <TbBlockquote className={iconSize} />
      </button>

      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />

      {/* Effacer formatage */}
      <button
        onClick={() => editor.chain().focus().unsetAllMarks().run()}
        className={`${buttonPadding} rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400`}
        title="Effacer le formatage"
      >
        <TbClearFormatting className={iconSize} />
      </button>
    </div>
  );
};

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = "",
  compact = false, // Par défaut à false pour garder la compatibilité
}: RichTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const editor = useEditor({
    extensions: getExtensions(placeholder),
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  // ✅ Synchroniser l'éditeur quand la prop value change
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const handleAddLink = (url: string) => {
    if (editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleAddImage = (url: string) => {
    if (editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const minHeight = compact ? "min-h-[60px]" : "min-h-[200px]";

  return (
    <>
      <div
        className={`flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-slate-900 ${className}`}
      >
        <Toolbar
          editor={editor}
          onLinkClick={() => setShowLinkModal(true)}
          onImageClick={() => setShowImageModal(true)}
          compact={compact}
        />

        <div className="flex-1 min-h-0 overflow-y-auto">
          <EditorContent
            editor={editor}
            className={`prose dark:prose-invert max-w-none [&_.ProseMirror]:p-3 [&_.ProseMirror]:outline-none [&_.ProseMirror]:${minHeight}`}
          />
        </div>
      </div>

      <LinkModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onSave={handleAddLink}
      />

      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onSave={handleAddImage}
      />
    </>
  );
}