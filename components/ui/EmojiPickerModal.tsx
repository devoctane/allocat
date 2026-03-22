'use client';

import React from 'react';
import { useHaptic } from "@/lib/hooks/useHaptic";

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  '🏠', '🚗', '🛒', '🍕', '☕', '🍷', '⚡', '💡', '🚰', '📱', '💻', '🎮',
  '🏖️', '✈️', '🎓', '💊', '🩺', '🏋️', '🎁', '🎉', '👕', '🛍️', '🐶', '👶',
  '🏦', '📈', '💰', '💳', '💸', '🛠️', '⛽', '🚌', '🚆', '🎬', '🎵', '⚽'
];

export default function EmojiPickerModal({ isOpen, onClose, onSelect }: EmojiPickerModalProps) {
  const haptic = useHaptic();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-card w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom flex flex-col max-h-[80vh] border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-foreground font-semibold text-lg">Select Icon</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2"
          >
            ✕
          </button>
        </div>
        
        <div className="overflow-y-auto pr-2 pb-4 flex-1">
          <div className="grid grid-cols-6 gap-3 sm:gap-4">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  haptic.selection();
                  onSelect(emoji);
                  onClose();
                }}
                className="text-2xl sm:text-3xl p-2 hover:bg-muted rounded-xl transition-all active:scale-95 grayscale hover:grayscale-0 flex items-center justify-center aspect-square"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Invisible backdrop click area */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
