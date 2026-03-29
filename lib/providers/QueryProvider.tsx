"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // IDB is the source of truth — React Query acts as in-memory cache on top.
            // Staleness is managed by IDB sync_meta timestamps, not by these timers.
            staleTime: Infinity,
            // Keep cached data for 10 minutes after component unmounts
            gcTime: 10 * 60 * 1000,
            // No refetch on focus — IDB invalidation handles freshness
            refetchOnWindowFocus: false,
            // Retry once on network failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
