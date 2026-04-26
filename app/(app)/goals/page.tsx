"use client";

import GoalsPage from "@/components/goals/GoalsPage";
import { useTour } from "@/lib/tour/useTour";
import { useTourDriver } from "@/lib/tour/useTourDriver";
import { mockGoalsData } from "@/lib/tour/mockData";

export default function Goals() {
  const tour = useTour();
  const tourActive = tour.isPageTourActive("goals");
  useTourDriver("goals");

  return <GoalsPage overrideGoals={tourActive ? mockGoalsData : undefined} />;
}
