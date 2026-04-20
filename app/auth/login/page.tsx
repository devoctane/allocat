"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { login } from "@/lib/actions/auth";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { useState } from "react";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const haptic = useHaptic();

  async function handleSubmit(formData: FormData) {
    haptic.light();
    setIsPending(true);
    setErrorMsg(null);
    const res = await login(formData);
    if (res?.error) {
      haptic.error();
      setErrorMsg(res.error);
      setIsPending(false);
    } else {
      haptic.success();
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-black overflow-x-hidden">
      <div className="flex items-center bg-black p-4 pb-2 justify-between w-full max-w-120 mx-auto">
        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">Sign In</h2>
      </div>

      <div className="max-w-[480px] w-full mx-auto px-4">
        <h1 className="text-white tracking-tight text-[40px] font-bold leading-tight pb-3 pt-10">Welcome back</h1>
        <p className="text-zinc-400 text-base font-normal leading-normal pb-8 pt-1">Enter your details to access your account.</p>

        <form action={handleSubmit} className="flex flex-col gap-6">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <label className="flex flex-col min-w-40 flex-1">
              <span className="text-white text-sm font-medium leading-normal pb-2">Email Address</span>
              <input 
                name="email"
                type="email"
                required
                className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-white focus:outline-0 focus:ring-1 focus:ring-zinc-600 border border-zinc-800 bg-zinc-900 focus:border-zinc-700 h-14 placeholder:text-zinc-500 p-[15px] text-base font-normal leading-normal" 
                placeholder="name@example.com" 
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex flex-col min-w-40 flex-1">
              <div className="flex justify-between items-center pb-2">
                <span className="text-white text-sm font-medium leading-normal">Password</span>
                <Link href="#" className="text-xs text-zinc-400 hover:text-white transition-colors">Forgot password?</Link>
              </div>
              <div className="flex w-full flex-1 items-stretch rounded-xl overflow-hidden border border-zinc-800 focus-within:ring-1 focus-within:ring-zinc-600 focus-within:border-zinc-700 bg-zinc-900">
                <input 
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="flex w-full min-w-0 flex-1 resize-none overflow-hidden text-white focus:outline-0 focus:ring-0 border-0 bg-transparent h-14 placeholder:text-zinc-500 p-[15px] pr-2 text-base font-normal leading-normal" 
                  placeholder="Enter your password" 
                />
                <button 
                  type="button"
                  onClick={() => {
                    haptic.light();
                    setShowPassword(!showPassword);
                  }}
                  className="text-zinc-500 flex items-center justify-center pr-[15px] cursor-pointer hover:text-white"
                >
                  <span className="material-symbols-outlined text-[24px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="mt-4 w-full h-14 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-zinc-500 text-sm">or continue with</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        <OAuthButtons />

        <p className="text-center text-zinc-400 text-sm mt-8">
          Don&apos;t have an account?{" "}
          <Link className="text-white font-bold hover:underline" href="/auth/signup">Create account</Link>
        </p>
      </div>
      <div className="h-20 bg-black"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent opacity-50"></div>
    </div>
  );
}
