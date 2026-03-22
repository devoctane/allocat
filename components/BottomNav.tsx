"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function BottomNav() {
  const pathname = usePathname();
  const haptic = useHaptic();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => haptic.light()}
              className={`flex flex-1 flex-col items-center gap-1 ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" }
                    : {}
                }
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-tighter ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
