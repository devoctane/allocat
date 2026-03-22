"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useHaptic } from "@/lib/hooks/useHaptic";

interface InlineEditableTextProps {
  value: string;
  onSave: (val: string) => void;
  className?: string;
  placeholder?: string;
}

export function InlineEditableText({ value, onSave, className = "", placeholder }: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const haptic = useHaptic();

  useEffect(() => {
    setCurrentVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (currentVal.trim() !== value && currentVal.trim() !== "") {
      haptic.success();
      onSave(currentVal.trim());
    } else {
      setCurrentVal(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentVal(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={currentVal}
        placeholder={placeholder}
        onChange={(e) => setCurrentVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-background text-foreground rounded outline-none border border-border focus:border-primary px-1 w-full max-w-[200px] ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => {
        haptic.light();
        setIsEditing(true);
      }}
      className={`cursor-pointer hover:bg-muted transition-colors rounded px-1 -mx-1 ${className}`}
    >
      {value || (placeholder && <span className="opacity-50">{placeholder}</span>)}
    </span>
  );
}
