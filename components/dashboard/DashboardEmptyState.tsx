import Link from "next/link";
import { MaterialSymbol } from "../ui/MaterialSymbol";

export default function DashboardEmptyState() {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 mt-12">
      {/* Main Empty State Content */}
      <div className="md:col-span-12 flex flex-col justify-center items-center py-24 px-8 bg-zinc-950/50 border border-zinc-900 rounded-xl text-center">
        <div className="mb-8">
          <MaterialSymbol icon="monitoring" size={64} className="text-zinc-800 font-thin" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-4 text-white">No financial data to display</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-12 text-sm leading-relaxed">
          The path to financial freedom begins with the first entry. Establish your baseline discipline by creating your initial asset allocation.
        </p>
        <Link 
          href="/budget"
          className="bg-white text-black font-black text-xs tracking-widest px-10 py-5 rounded-none hover:bg-gray-200 transition-colors active:scale-95 duration-200 uppercase inline-block"
        >
          CREATE FIRST ALLOCATION
        </Link>
      </div>
    </div>
  );
}
