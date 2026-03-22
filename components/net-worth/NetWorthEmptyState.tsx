import { MaterialSymbol } from "../ui/MaterialSymbol";

export default function NetWorthEmptyState({ onAddAsset }: { onAddAsset?: () => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full mt-12">
      {/* Hero Empty Card */}
      <div className="md:col-span-12 bg-card rounded-xl p-12 flex flex-col items-start justify-center border border-border relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-muted rounded-full blur-3xl group-hover:bg-muted/80 transition-colors duration-700"></div>
        <h3 className="text-3xl font-bold tracking-tight mb-4 text-foreground">Track your wealth</h3>
        <p className="text-muted-foreground max-w-sm mb-10 leading-relaxed">
          Your financial monolith starts here. Connect your accounts or manually add assets to visualize your path to absolute discipline.
        </p>
        <button 
          onClick={onAddAsset}
          className="bg-foreground text-background px-8 py-4 font-bold tracking-tight active:scale-95 duration-200 flex items-center gap-3 rounded-lg"
        >
          <MaterialSymbol icon="add" className="font-bold" />
          Add Asset
        </button>
      </div>
    </div>
  );
}
