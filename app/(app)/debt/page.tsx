"use client";

import DebtPage from "@/components/debt/DebtPage";
import { useDebtData } from "@/lib/hooks/useDebt";
import { useTour } from "@/lib/tour/useTour";
import { useTourDriver } from "@/lib/tour/useTourDriver";
import { mockDebtData } from "@/lib/tour/mockData";

function DebtSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="sticky top-0 px-4 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-muted rounded w-36" />
          <div className="size-8 bg-muted rounded-full" />
        </div>
      </div>
      <div className="px-4 space-y-4 mt-2">
        <div className="col-span-2 bg-card border border-border p-5 rounded-xl space-y-2">
          <div className="h-2 bg-muted/50 rounded w-1/4" />
          <div className="h-8 bg-muted rounded w-1/2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border p-4 rounded-xl space-y-2">
              <div className="h-2 bg-muted/50 rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
        <div className="h-12 bg-muted rounded-xl" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border p-4 rounded-xl space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-muted rounded w-32" />
                <div className="h-5 bg-muted rounded w-20" />
              </div>
              <div className="h-1.5 bg-muted/50 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Debt() {
  const { data, isLoading, isError } = useDebtData();
  const tour = useTour();
  const tourActive = tour.isPageTourActive("debt");
  useTourDriver("debt");

  if (isLoading && !tourActive) return <DebtSkeleton />;

  if (isError && !tourActive) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <p className="text-sm text-muted-foreground">Failed to load debt data</p>
      </div>
    );
  }

  const displayData = tourActive ? mockDebtData : (data ?? []);

  return <DebtPage data={displayData} />;
}
