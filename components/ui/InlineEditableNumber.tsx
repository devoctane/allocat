"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useHaptic } from "@/lib/hooks/useHaptic";

interface InlineEditableNumberProps {
  value: number;
  onSave: (val: number) => void;
  className?: string;
  formatAsCurrency?: boolean;
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export function InlineEditableNumber({ value, onSave, className = "", formatAsCurrency = true }: InlineEditableNumberProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);
  const haptic = useHaptic();

  useEffect(() => {
    setCurrentVal(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text when focusing
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const num = parseFloat(currentVal);
    if (!isNaN(num) && num >= 0 && num !== value) {
      haptic.success();
      setCurrentVal(value.toString());
      onSave(num);
    } else {
      setCurrentVal(value.toString());
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setCurrentVal(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        step="1"
        value={currentVal}
        onChange={(e) => setCurrentVal(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`bg-background text-foreground rounded outline-none border border-border focus:border-primary px-1 w-full max-w-[120px] tabular-nums text-right ${className}`}
      />
    );
  }

  const displayVal = formatAsCurrency ? formatCurrency(value) : value.toLocaleString("en-IN");

  return (
    <span
      onClick={() => {
        haptic.light();
        setIsEditing(true);
      }}
      className={`cursor-pointer hover:bg-muted transition-colors rounded px-1 -mx-1 tabular-nums ${className}`}
    >
      {displayVal}
    </span>
  );
}
