"use client";

import { useEffect, useRef } from "react";
import { useTour } from "./useTour";
import { TOUR_STEPS } from "./tourSteps";
import type { TourPage } from "./types";

export function useTourDriver(page: TourPage) {
  const tour = useTour();
  // Holds the active driver instance so cleanup can destroy it if user navigates away
  const driverRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    if (!tour.isPageTourActive(page)) return;

    // `cancelled` handles React Strict Mode double-invocation:
    // First run: cancelled=false → timer set
    // Cleanup (Strict Mode unmount): cancelled=true → timer aborted, driverRef still null
    // Second run (real mount): fresh cancelled=false → timer fires
    let cancelled = false;

    const timer = window.setTimeout(async () => {
      if (cancelled) return;

      const { driver } = await import("driver.js");

      const steps = TOUR_STEPS[page];
      if (!steps?.length || cancelled) return;

      const driverObj = driver({
        showProgress: true,
        showButtons: ["next", "previous", "close"],
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Done",
        progressText: "{{current}} of {{total}}",
        popoverClass: "allocat-tour-popover",
        overlayColor: "rgb(0,0,0)",
        overlayOpacity: 0.72,
        onDestroyStarted: () => {
          driverRef.current = null;
          tour.markSeen(page);
          driverObj.destroy();
        },
        steps,
      });

      driverRef.current = driverObj;
      driverObj.drive();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      // If driver was active when user navigated away, destroy it so the
      // overlay is removed and markSeen is called via onDestroyStarted.
      if (driverRef.current) {
        const d = driverRef.current;
        driverRef.current = null;
        d.destroy();
      }
    };
  // Only re-run when page changes (navigating to a new section)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
}
