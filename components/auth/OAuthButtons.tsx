"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useHaptic } from "@/lib/hooks/useHaptic";

export function OAuthButtons() {
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const haptic = useHaptic();

  const handleGoogleLogin = async () => {
    haptic.light();
    setIsPending(true);
    setErrorMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      haptic.error();
      setErrorMsg(error.message);
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}
      <button 
        type="button"
        disabled={isPending}
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-2 h-14 bg-transparent border border-zinc-800 rounded-xl hover:bg-zinc-900 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-[20px]">account_circle</span>
        <span className="text-sm font-medium">{isPending ? "Connecting..." : "Continue with Google"}</span>
      </button>
    </div>
  );
}
