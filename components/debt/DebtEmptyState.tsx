import { MaterialSymbol } from "../ui/MaterialSymbol";

export default function DebtEmptyState({ onAddDebt }: { onAddDebt?: () => void }) {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center mt-12 relative z-10">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-6">Clean slate.</h1>
        <p className="text-muted-foreground text-lg leading-relaxed mx-auto font-light">
          Your architecture is clear. No liabilities detected within the monolith. Maintain the discipline.
        </p>
      </div>

      {/* Call to Action */}
      <div className="flex flex-col items-center gap-8">
        <button 
          onClick={onAddDebt}
          className="bg-foreground text-background font-black text-xs tracking-[0.2em] uppercase px-12 py-5 rounded-none hover:bg-muted active:scale-95 transition-all duration-200 flex items-center gap-3 group"
        >
          ADD DEBT
          <MaterialSymbol icon="add" className="text-sm group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Current Standing</span>
          <div className="h-1 w-24 bg-muted relative overflow-hidden">
            <div className="absolute inset-0 bg-foreground w-0 duration-1000 transition-all"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
