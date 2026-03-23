'use client'

import React from 'react'
import { Editor } from '@tiptap/react'
import { 
  MdFormatBold, 
  MdFormatItalic, 
  MdFormatUnderlined,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatQuote,
  MdCode,
  MdUndo,
  MdRedo,
  MdLink,
  MdImage,
  MdHorizontalRule,
  MdFormatClear,
} from 'react-icons/md'

interface ToolbarProps {
  editor: Editor | null
}

const ToolbarButton = ({ 
  onClick, 
  active, 
  children, 
  title 
}: { 
  onClick: () => void
  active?: boolean
  children: React.ReactNode
  title?: string
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`p-2 rounded-lg transition-colors ${
      active 
        ? 'bg-primary text-white' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
    }`}
  >
    {children}
  </button>
)

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('URL image:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Annuler">
        <MdUndo className="text-lg" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Rétablir">
        <MdRedo className="text-lg" />
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBold().run()} 
        active={editor.isActive('bold')}
        title="Gras"
      >
        <MdFormatBold className="text-lg" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleItalic().run()} 
        active={editor.isActive('italic')}
        title="Italique"
      >
        <MdFormatItalic className="text-lg" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleUnderline().run()} 
        active={editor.isActive('underline')}
        title="Souligné"
      >
        <MdFormatUnderlined className="text-lg" />
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBulletList().run()} 
        active={editor.isActive('bulletList')}
        title="Liste à puces"
      >
        <MdFormatListBulleted className="text-lg" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
        active={editor.isActive('orderedList')}
        title="Liste numérotée"
      >
        <MdFormatListNumbered className="text-lg" />
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
        active={editor.isActive('blockquote')}
        title="Citation"
      >
        <MdFormatQuote className="text-lg" />
      </ToolbarButton>
      <ToolbarButton 
        onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
        active={editor.isActive('codeBlock')}
        title="Code"
      >
        <MdCode className="text-lg" />
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Ligne">
        <MdHorizontalRule className="text-lg" />
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

      <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="Lien">
        <MdLink className="text-lg" />
      </ToolbarButton>
      <ToolbarButton onClick={addImage} title="Image">
        <MdImage className="text-lg" />
      </ToolbarButton>

      <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1" />

      <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Effacer">
        <MdFormatClear className="text-lg" />
      </ToolbarButton>
    </div>
  )
}