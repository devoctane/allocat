"use client";

import NetWorthPage from "@/components/net-worth/NetWorthPage";
import { useNetWorthData } from "@/lib/hooks/useNetWorth";
import { useTour } from "@/lib/tour/useTour";
import { useTourDriver } from "@/lib/tour/useTourDriver";
import { mockNetWorthData } from "@/lib/tour/mockData";

function NetWorthSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="sticky top-0 px-6 pt-10 pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-24" />
          <div className="size-8 bg-muted rounded-full" />
        </div>
      </div>
      <div className="p-4 space-y-6">
        <div className="bg-card p-6 rounded-xl border border-border space-y-4">
          <div className="h-3 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded w-1/2" />
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 bg-muted rounded w-20" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-3 bg-muted rounded w-16" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-muted rounded-full" />
                <div className="space-y-1.5">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-2 bg-muted rounded w-16" />
                </div>
              </div>
              <div className="h-4 bg-muted rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NetWorth() {
  const { data, isLoading, isError } = useNetWorthData();
  const tour = useTour();
  const tourActive = tour.isPageTourActive("net-worth");
  useTourDriver("net-worth");

  if (isLoading && !tourActive) return <NetWorthSkeleton />;

  if ((isError || !data) && !tourActive) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <p className="text-sm text-muted-foreground">Failed to load net worth data</p>
      </div>
    );
  }

  const displayData = tourActive ? mockNetWorthData : data!;

  return <NetWorthPage data={displayData} />;
}
