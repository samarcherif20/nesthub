// components/ui/RichTextEditor.tsx
/*se client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {TextStyle} from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const buttonClass = (isActive?: boolean) => 
    `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-gray-200 text-gray-900' 
        : 'text-gray-700 hover:bg-gray-100'
    }`;

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-300 bg-white">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        title="Gras"
        type="button"
      >
        <span className="font-bold">B</span>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        title="Italique"
        type="button"
      >
        <span className="italic">I</span>
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClass(editor.isActive('underline'))}
        title="Souligné"
        type="button"
      >
        <span className="underline">U</span>
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      <select
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: parseInt(value) as 1 | 2 | 3 }).run();
          }
        }}
        className="px-2 py-1 text-sm border rounded bg-white text-gray-700"
        value={
          editor.isActive('paragraph') ? 'paragraph' : 
          editor.isActive('heading', { level: 1 }) ? '1' :
          editor.isActive('heading', { level: 2 }) ? '2' :
          editor.isActive('heading', { level: 3 }) ? '3' : 'paragraph'
        }
      >
        <option value="paragraph">Normal</option>
        <option value="1">Titre 1</option>
        <option value="2">Titre 2</option>
        <option value="3">Titre 3</option>
      </select>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Liste à puces"
        type="button"
      >
        • Liste
      </button>
      
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Liste numérotée"
        type="button"
      >
        1. Liste
      </button>

      <div className="w-px h-6 bg-gray-300 mx-2" />

      <button
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={buttonClass(editor.isActive({ textAlign: 'left' }))}
        title="Aligner à gauche"
        type="button"
      >
        ←
      </button>
      
      <button
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={buttonClass(editor.isActive({ textAlign: 'center' }))}
        title="Centrer"
        type="button"
      >
        ↔
      </button>
      
      <button
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={buttonClass(editor.isActive({ textAlign: 'right' }))}
        title="Aligner à droite"
        type="button"
      >
        →
      </button>
    </div>
  );
};

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Écrivez votre texte ici...',
  minHeight = '400px'
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none p-4 focus:outline-none',
        style: `min-height: ${minHeight};`,
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!isMounted || !editor) {
    return (
      <div 
        className="w-full rounded-lg border border-gray-300 bg-white p-4"
        style={{ minHeight }}
      >
        <div dangerouslySetInnerHTML={{ __html: value }} />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col rounded-lg border border-gray-300 bg-white overflow-hidden shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}*/
