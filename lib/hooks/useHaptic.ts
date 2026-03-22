"use client";

/**
 * useHaptic — Haptic feedback via the Web Vibration API.
 *
 * Gracefully degrades on browsers / devices that do not support vibration.
 * All durations are intentionally short to feel native and non-intrusive.
 */

export type HapticStyle = "light" | "medium" | "heavy" | "success" | "error" | "selection";

const PATTERNS: Record<HapticStyle, number | number[]> = {
  /** 10ms — subtle tap, used for navigation & selection */
  light: 10,
  /** 20ms — standard interaction feedback */
  medium: 20,
  /** 35ms — destructive actions, confirmations */
  heavy: 35,
  /** [15, 60, 15] — double-tap pattern for success / save */
  success: [15, 60, 15],
  /** [20, 40, 20, 40, 20] — error / warning pattern */
  error: [20, 40, 20, 40, 20],
  /** 8ms — bare minimum, for list item selection */
  selection: 8,
};

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  if (!("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Silently ignore — some browsers throw on vibrate call
  }
}

export function useHaptic() {
  return {
    /**
     * Trigger haptic feedback.
     * @param style — the haptic pattern to play (default: "light")
     */
    trigger(style: HapticStyle = "light") {
      vibrate(PATTERNS[style]);
    },

    /** Convenience aliases */
    light: () => vibrate(PATTERNS.light),
    medium: () => vibrate(PATTERNS.medium),
    heavy: () => vibrate(PATTERNS.heavy),
    success: () => vibrate(PATTERNS.success),
    error: () => vibrate(PATTERNS.error),
    selection: () => vibrate(PATTERNS.selection),
  };
}
