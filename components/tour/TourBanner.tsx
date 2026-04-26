"use client";

import { useEffect, useState } from "react";

interface TourBannerProps {
  title: string;
  description: string;
  onDismiss: () => void;
}

export default function TourBanner({ title, description, onDismiss }: TourBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  function handleDismiss() {
    setVisible(false);
    window.setTimeout(onDismiss, 220);
  }

  return (
    <div
      className="mx-7 mb-0 mt-5 transition-all duration-200"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-6px)",
      }}
    >
      <div className="bg-foreground text-background px-5 py-4">
        {/* Label row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="font-mono text-[9px] tracking-[0.18em] uppercase opacity-60 mb-1">
              Guide
            </div>
            <div className="font-mono text-[11px] tracking-[0.14em] uppercase font-medium">
              {title}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Skip guide"
            className="shrink-0 mt-0.5 font-mono text-[9px] tracking-[0.14em] uppercase opacity-50 hover:opacity-100 transition-opacity"
          >
            SKIP
          </button>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed opacity-75 mb-4">
          {description}
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full border border-background/30 py-2.5 font-mono text-[10px] tracking-[0.14em] uppercase text-background hover:bg-background/10 transition-colors"
        >
          Got it →
        </button>
      </div>

      {/* Accent line */}
      <div className="h-px bg-border" />
    </div>
  );
}
