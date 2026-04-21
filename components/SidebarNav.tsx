"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useHaptic } from "@/lib/hooks/useHaptic";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
  },
  {
    label: "Budget",
    href: "/budget",
    icon: "account_balance_wallet",
  },
  {
    label: "Net Worth",
    href: "/net-worth",
    icon: "pie_chart",
  },
  {
    label: "Debt",
    href: "/debt",
    icon: "credit_card",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: "person",
  },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const haptic = useHaptic();
  const [showMobileHint, setShowMobileHint] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("mobile-hint-dismissed")) setShowMobileHint(true);
  }, []);

  const dismissHint = () => {
    localStorage.setItem("mobile-hint-dismissed", "1");
    setShowMobileHint(false);
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card min-h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground">AlloCat</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => haptic.light()}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "bg-primary text-primary-foreground font-medium" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }
                    : {}
                }
              >
                {item.icon}
              </span>
              <span
                className={`text-sm font-bold uppercase tracking-widest ${
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border flex flex-col gap-3">
        {showMobileHint && (
          <div className="p-3 rounded-xl bg-muted/60 border border-border flex items-start gap-2">
            <span
              className="material-symbols-outlined text-muted-foreground shrink-0 mt-0.5"
              style={{ fontSize: "16px" }}
            >
              smartphone
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-tight">Better on mobile</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                AlloCat is designed for your phone. Open it on mobile for the best experience.
              </p>
            </div>
            <button
              onClick={dismissHint}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
            </button>
          </div>
        )}
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center">
          AlloCat © {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  );
}
