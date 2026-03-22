"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MaterialSymbol } from "@/components/ui/MaterialSymbol";
import { markUserAsOnboarded } from "@/lib/actions/profile";
import { useHaptic } from "@/lib/hooks/useHaptic";

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const haptic = useHaptic();

  const handleComplete = () => {
    haptic.success();
    startTransition(async () => {
      const res = await markUserAsOnboarded();
      if (!res.error) {
        router.push("/dashboard");
      }
    });
  };

  return (
    <div className="bg-black text-white min-h-[100dvh] font-body selection:bg-white selection:text-black overflow-hidden relative">
      
      {/* Background Common Aesthetic */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black"></div>
        <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black to-transparent"></div>
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <main className="relative h-dvh w-full flex flex-col justify-between px-6 py-12 md:px-16 md:py-20 lg:px-32 z-10">
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <span className="font-black gap-2 flex tracking-tighter text-2xl text-white">
                ALLOCAT
              </span>
              <div className="h-0.5 w-12 bg-white"></div>
            </div>
            <div className="text-right">
              <p className="font-label text-xs uppercase tracking-[0.2em] text-gray-500">System.v.01</p>
            </div>
          </div>
              <img src="/paw-white.png" alt="logo" className="w-12 h-12 p-1 bg-white rounded-full" />

          <div className="max-w-5xl mt-12 md:mt-0">
            <div className="flex flex-col gap-8">
              <h1 className="font-black text-[clamp(2.5rem,8vw,4.5rem)] leading-[0.9] tracking-tighter text-white">
                TAKE COMMAND OF YOUR FINANCIAL FUTURE.
              </h1>
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="h-px w-24 bg-gray-700 hidden md:block"></div>
                <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-xl">
                  Erase the noise. Embrace the discipline. A high-fidelity interface for the architect of their own wealth.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-12 pt-12">
            <div className="flex items-center gap-4 text-gray-500">
              <MaterialSymbol icon="verified_user" className="text-sm" />
              <p className="text-[10px] uppercase tracking-widest leading-none">
                Security Protocols Active // Grayscale Integrity Verified
              </p>
            </div>
            <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-4">
              <button 
                onClick={() => {
                  haptic.light();
                  setStep(2);
                }}
                className="px-12 py-5 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center gap-4 group"
              >
                Begin Initialization
                <MaterialSymbol icon="arrow_forward" className="text-xl group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <main className="relative min-h-[100dvh] pt-20 pb-32 px-6 max-w-7xl mx-auto z-10 flex flex-col justify-center">
          <section className="mb-16 mt-8">
            <p className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase mb-4">Phase 02 / The Architecture</p>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none max-w-4xl">
              Budget, Net Worth, <br/>and Debt
            </h1>
            <div className="h-1 w-24 bg-white mt-8"></div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-zinc-900/50 rounded-xl p-8 flex flex-col justify-between border border-white/5">
              <div>
                <div className="flex justify-between items-start mb-12">
                  <span className="text-xs uppercase tracking-widest text-gray-500 font-bold">Total Net Worth</span>
                  <MaterialSymbol icon="monitoring" className="text-white/50" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl md:text-8xl font-black tracking-tighter tabular-nums">xxx,xxx</span>
                  <span className="text-xl font-medium text-gray-500 tabular-nums">.00</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-white rounded-xl p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-widest text-black/40 font-bold mb-8 block">Total Debt</span>
                <div className="text-4xl font-black text-black tracking-tighter tabular-nums">xx,xxx</div>
              </div>
              <div className="mt-8">
                <div className="w-full bg-black/10 h-1 mb-4">
                  <div className="bg-black h-full w-2/3"></div>
                </div>
              </div>
            </div>

            <div className="md:col-span-12 bg-zinc-900/50 border border-white/5 rounded-xl p-8">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Monthly Budget</h3>
                <MaterialSymbol icon="payments" className="text-gray-500" />
              </div>
              <div className="mt-8 flex gap-2">
                <div className="h-2 flex-grow bg-white"></div>
                <div className="h-2 w-12 bg-neutral-800"></div>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col md:flex-row gap-8 items-center justify-between border-t border-white/10 pt-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ready to synchronize?</h2>
              <p className="text-gray-500 text-sm">Update your system accounts to refresh the monolith.</p>
            </div>
            <button 
              onClick={() => {
                haptic.light();
                setStep(3);
              }}
              className="w-full md:w-auto bg-white text-black px-12 py-4 text-sm font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform"
            >
              Continue Architecture
            </button>
          </div>
        </main>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <main className="relative min-h-[100dvh] flex flex-col justify-center px-6 max-w-xl mx-auto z-10">
          <section className="space-y-4">
            <div className="inline-block border-l-4 border-white pl-4 mb-8">
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-gray-500">Step 03 — Final</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-[0.9] text-white">
              READY TO <br/> START.
            </h1>
            <p className="text-gray-400 text-lg max-w-sm font-light leading-relaxed pt-4">
              The architecture for your financial freedom is ready. Choose your starting discipline.
            </p>
          </section>

          <section className="grid grid-cols-2 gap-4 mt-12 mb-16">
            <div className="col-span-2 bg-zinc-900/50 border border-white/10 rounded-xl p-6 flex flex-col justify-between aspect-video">
              <MaterialSymbol icon="account_balance_wallet" size={32} className="mb-4" />
              <div>
                <h3 className="font-bold text-xl uppercase tracking-tight">Net Asset Control</h3>
                <p className="text-gray-500 text-sm mt-1">Full transparency across every account and vault.</p>
              </div>
            </div>
          </section>

          <footer className="space-y-6">
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleComplete}
                className="w-full bg-white text-black font-black py-5 text-sm uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-[0.98] duration-200"
              >
                Enter the ALLOCAT
              </button>
            </div>
            <div className="flex justify-between items-center px-2">
              <div className="flex gap-1">
                <div className="h-1 w-8 bg-zinc-800"></div>
                <div className="h-1 w-8 bg-zinc-800"></div>
                <div className="h-1 w-8 bg-white"></div>
              </div>
              <span className="text-[10px] uppercase tracking-tighter text-gray-600 font-bold">Encrypted End-To-End</span>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}
