import React from "react";

export default function Loading() {
  return (
    <div className="animate-pulse px-4 py-8 space-y-6">
      <div className="h-8 bg-muted rounded w-1/3 mb-10"></div>
      
      <div className="bg-card rounded-xl p-6 border border-border space-y-4">
        <div className="h-3 bg-muted rounded w-1/4"></div>
        <div className="h-10 bg-muted rounded w-1/2"></div>
        <div className="h-2 bg-muted rounded w-full"></div>
      </div>

      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
        <div className="h-24 bg-card rounded-xl border border-border w-full"></div>
        <div className="h-24 bg-card rounded-xl border border-border w-full"></div>
      </div>
    </div>
  );
}
