"use client";

import Link from "next/link";
import { MaterialSymbol } from "@/components/ui/MaterialSymbol";
import ThemeSelector from "@/components/profile/ThemeSelector";
import { signOut } from "@/lib/actions/auth";
import { useProfile } from "@/lib/hooks/useProfile";

export default function ProfilePage() {
  const { data: profile } = useProfile();

  return (
    <div className="pt-12 px-6 max-w-2xl mx-auto space-y-12 pb-32">
      {/* Header Section */}
      <header className="py-8 border-b border-border">
        <div className="font-display text-[32px] leading-none tracking-[-0.02em] text-foreground">Profile</div>
        <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-foreground mt-2">
          Financial Identity
        </div>
      </header>

      {/* User Profile Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-card/50 p-8 rounded-lg border border-border">
        <div className="col-span-1 flex justify-center md:justify-start">
          <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-none bg-foreground p-1">
            <div className="w-full h-full bg-background flex items-center justify-center">
              <MaterialSymbol icon="person" size={64} className="text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="col-span-2 space-y-1">
          <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-muted-foreground font-bold">
            Verified Account
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            {profile?.full_name || "Anonymous Architect"}
          </h2>
          <p className="text-muted-foreground font-mono tracking-tight text-sm">
            {profile?.email || ""}
          </p>

          <div className="pt-4">
            <button className="bg-primary text-primary-foreground px-6 py-3 font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity active:scale-95 duration-200">
              Account Settings
            </button>
          </div>
        </div>
      </section>

      {/* Account Settings Section */}
      <section className="space-y-6">
        <div className="flex items-end gap-3 mb-2">
          <h3 className="text-lg font-bold tracking-tight uppercase text-foreground">Account</h3>
          <div className="h-px bg-border flex-grow mb-2"></div>
        </div>

        <div className="space-y-1">
          <Link
            href="/activity"
            className="w-full flex justify-between items-center p-5 bg-card/50 border border-border hover:bg-muted transition-colors group"
          >
            <div className="flex items-center gap-4">
              <MaterialSymbol icon="history" className="text-muted-foreground" />
              <span className="font-bold tracking-tight text-foreground">See Activity</span>
            </div>
            <MaterialSymbol
              icon="chevron_right"
              className="text-muted-foreground group-hover:translate-x-1 transition-transform"
            />
          </Link>

          <button className="w-full flex justify-between items-center p-5 bg-card/50 border border-border hover:bg-muted transition-colors group">
            <div className="flex items-center gap-4">
              <MaterialSymbol icon="person_edit" className="text-muted-foreground" />
              <span className="font-bold tracking-tight text-foreground">Edit Profile</span>
            </div>
            <MaterialSymbol
              icon="chevron_right"
              className="text-muted-foreground group-hover:translate-x-1 transition-transform"
            />
          </button>

          <button className="w-full flex justify-between items-center p-5 bg-card/50 border border-border hover:bg-muted transition-colors group">
            <div className="flex items-center gap-4">
              <MaterialSymbol icon="shield" className="text-muted-foreground" />
              <span className="font-bold tracking-tight text-foreground">Security & Passwords</span>
            </div>
            <MaterialSymbol
              icon="chevron_right"
              className="text-muted-foreground group-hover:translate-x-1 transition-transform"
            />
          </button>

          <button className="w-full flex justify-between items-center p-5 bg-card/50 border border-border hover:bg-muted transition-colors group">
            <div className="flex items-center gap-4">
              <MaterialSymbol icon="notifications" className="text-muted-foreground" />
              <span className="font-bold tracking-tight text-foreground">Notification Settings</span>
            </div>
            <MaterialSymbol
              icon="chevron_right"
              className="text-muted-foreground group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </section>

      {/* App Preferences Section */}
      <section className="space-y-6">
        <div className="flex items-end gap-3 mb-2">
          <h3 className="text-lg font-bold tracking-tight uppercase text-foreground">Preferences</h3>
          <div className="h-px bg-border flex-grow mb-2"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-border rounded-lg overflow-hidden border border-border">
          <ThemeSelector />

          <div className="bg-card p-6 flex flex-col justify-between h-40 col-span-1">
            <div className="flex justify-between items-start">
              <MaterialSymbol icon="payments" className="text-foreground" />
              <span className="font-mono font-bold text-foreground">USD</span>
            </div>
            <div>
              <p className="font-bold text-foreground">Currency</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                United States Dollar
              </p>
            </div>
          </div>

          <div className="bg-card p-6 flex flex-col justify-between h-40 col-span-1">
            <div className="flex justify-between items-start">
              <MaterialSymbol icon="lock" className="text-foreground" />
              <span className="text-[10px] bg-muted text-foreground px-2 py-1 uppercase font-bold tracking-tighter">
                Encrypted
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="font-bold text-foreground">Data Privacy</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                  Manage shared data and analytics
                </p>
              </div>
              <MaterialSymbol icon="arrow_outward" className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="py-12 flex flex-col items-center gap-8">
        <form action={signOut} className="w-full max-w-sm">
          <button
            type="submit"
            className="group relative flex items-center justify-center w-full py-5 border border-red-500/30 hover:bg-red-500/10 transition-all duration-300 active:scale-95"
          >
            <span className="text-red-500 font-black uppercase tracking-[0.3em] text-sm">Logout</span>
          </button>
        </form>

        <footer className="text-center space-y-1 opacity-40">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.4em] text-foreground">v1.0.4</p>
          <p className="text-[0.5rem] font-medium tracking-widest text-foreground">AlloCat © 2026</p>
        </footer>
      </section>
    </div>
  );
}
