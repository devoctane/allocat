import { MaterialSymbol } from "../ui/MaterialSymbol";

export default function BudgetEmptyState() {
  return (
    <div className="flex flex-col items-center text-center mt-12 relative">
      {/* Structural Asymmetry: Lead-In Header */}
      <div className="w-full mb-24 text-left">
        <h1 className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase mb-4">Current Outlook</h1>
        <div className="h-0.5 w-12 bg-foreground mb-8"></div>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-none">
          NO DISCIPLINE<br/>FOUND.
        </h2>
      </div>

      {/* Empty State Central Messaging */}
      <div className="space-y-12 w-full flex flex-col items-center">
        <div className="flex flex-col items-center gap-6">
          <MaterialSymbol icon="account_balance_wallet" size={64} className="text-muted-foreground/30 font-thin" />
          <p className="text-xl md:text-2xl font-light tracking-tight text-muted-foreground max-w-md">
            Your budget is empty. Establish your financial architecture to begin.
          </p>
        </div>

        {/* Primary Action */}
        <button className="bg-foreground text-background px-12 py-5 font-bold tracking-[0.1em] text-sm active:scale-95 duration-200 transition-all hover:bg-foreground/90">
          ADD CATEGORY
        </button>
      </div>

      {/* Background Monolith Aesthetic Decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 opacity-5">
        <div className="absolute bottom-0 right-0 w-1/2 h-full bg-gradient-to-t from-foreground to-transparent transform skew-x-12"></div>
        <div className="absolute top-0 left-10 text-[20rem] font-black text-foreground leading-none tracking-tighter select-none">
          0.00
        </div>
      </div>
    </div>
  );
}
