"use client";

import ActivityPage from "@/components/activity/ActivityPage";
import { useTour } from "@/lib/tour/useTour";
import { useTourDriver } from "@/lib/tour/useTourDriver";
import { mockActivityLogs } from "@/lib/tour/mockData";

export default function Page() {
  const tour = useTour();
  const tourActive = tour.isPageTourActive("activity");
  useTourDriver("activity");

  return <ActivityPage overrideLogs={tourActive ? mockActivityLogs : undefined} />;
}
