// components/ui/chat/EmojiPicker.tsx
import React, { useState, useRef, useEffect } from 'react';
import EmojiPickerReact from 'emoji-picker-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  children: React.ReactNode;
}

export function EmojiPicker({ onEmojiSelect, children }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>
        {children}
      </div>
      {isOpen && (
        <div ref={pickerRef} className="absolute bottom-full mb-2 right-0 z-50">
          <EmojiPickerReact
            onEmojiClick={(emojiData) => {
              onEmojiSelect(emojiData.emoji);
              setIsOpen(false);
            }}
            theme="auto"
            lazyLoadEmojis
          />
        </div>
      )}
    </div>
  );
}