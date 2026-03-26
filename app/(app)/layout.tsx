import BottomNav from "@/components/BottomNav";
import AIOverlay from "@/components/ai/AIOverlay";


export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <div className="app-container">
      <main className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        {children}
      </main>
      <BottomNav />
      <AIOverlay />
    </div>
  );
}
