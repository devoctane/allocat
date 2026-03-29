import BottomNav from "@/components/BottomNav";
import AIOverlay from "@/components/ai/AIOverlay";
import { SyncProvider } from "@/lib/providers/SyncProvider";
import { SyncStatusBadge } from "@/components/ui/SyncStatusBadge";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SyncProvider>
      <div className="app-container">
        {/* Sync status indicator — top-right, only visible when offline or syncing */}
        <div className="fixed top-3 right-4 z-50">
          <SyncStatusBadge />
        </div>
        <main className="flex-1 overflow-y-auto pb-28 no-scrollbar">
          {children}
        </main>
        <BottomNav />
        <AIOverlay />
      </div>
    </SyncProvider>
  );
}
