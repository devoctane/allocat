"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BudgetPage from "@/components/budget/BudgetPage";
import { useBudgetData } from "@/lib/hooks/useBudget";
import { useTour } from "@/lib/tour/useTour";
import { useTourDriver } from "@/lib/tour/useTourDriver";
import { mockBudgetData } from "@/lib/tour/mockData";

function BudgetSkeleton() {
  return (
    <div className="animate-pulse px-4 py-8 space-y-6">
      <div className="flex items-center justify-between px-2 mb-6">
        <div className="space-y-1">
          <div className="h-6 bg-muted rounded w-20" />
          <div className="h-3 bg-muted rounded w-32" />
        </div>
        <div className="size-10 bg-muted rounded-full" />
      </div>
      <div className="h-14 bg-card rounded-xl border border-border w-full" />
      <div className="grid grid-cols-3 border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-r border-border space-y-2">
          <div className="h-2 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
        <div className="p-4 border-r border-border space-y-2">
          <div className="h-2 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
        <div className="p-4 space-y-2">
          <div className="h-2 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 bg-muted rounded w-20" />
              <div className="h-4 bg-muted rounded w-16" />
            </div>
            <div className="h-1.5 bg-muted rounded-full w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetContent() {
  const searchParams = useSearchParams();
  const tour = useTour();
  const tourActive = tour.isPageTourActive("budget");
  useTourDriver("budget");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const selectedMonth = searchParams.get("month")
    ? parseInt(searchParams.get("month")!, 10)
    : currentMonth;
  const selectedYear = searchParams.get("year")
    ? parseInt(searchParams.get("year")!, 10)
    : currentYear;

  const { data, isLoading, isError } = useBudgetData(selectedMonth, selectedYear);

  if (isLoading && !tourActive) return <BudgetSkeleton />;

  if (isError || (!data && !tourActive)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
        <p className="text-sm text-muted-foreground">Failed to load budget</p>
      </div>
    );
  }

  const displayData = tourActive
    ? { ...mockBudgetData, month: selectedMonth, year: selectedYear }
    : data!;

  return (
    <BudgetPage
      data={displayData}
      defaultMonth={selectedMonth}
      defaultYear={selectedYear}
    />
  );
}

export default function Budget() {
  return (
    <Suspense fallback={<BudgetSkeleton />}>
      <BudgetContent />
    </Suspense>
  );
}
