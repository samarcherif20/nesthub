import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'

export const getExtensions = (placeholder?: string) => [
  StarterKit.configure({
    // Désactiver les extensions du StarterKit qui causent des doublons
    bulletList: false,
    orderedList: false,
    listItem: false,
    link: false,        // ← DÉSACTIVER link pour éviter le doublon
    underline: false,   // ← DÉSACTIVER underline pour éviter le doublon
  }),
  // Ajouter nos propres extensions
  BulletList.configure({
    HTMLAttributes: {
      class: 'list-disc ml-4',
    },
  }),
  OrderedList.configure({
    HTMLAttributes: {
      class: 'list-decimal ml-4',
    },
  }),
  ListItem,
  Underline,  // ← Notre version d'underline
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline cursor-pointer',
    },
  }),
  Image.configure({
    inline: true,
    HTMLAttributes: {
      class: 'rounded-lg max-w-full h-auto',
    },
  }),
  Placeholder.configure({
    placeholder: placeholder || '...',
  }),
]