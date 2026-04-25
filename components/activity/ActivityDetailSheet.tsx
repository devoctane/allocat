"use client";

import { MaterialSymbol } from "@/components/ui/MaterialSymbol";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import type { ActivityLogRow } from "@/lib/db";

function categoryLabel(category: ActivityLogRow["category"]) {
  switch (category) {
    case "budget":
      return "Budget";
    case "net_worth":
      return "Net Worth";
    case "goals":
      return "Goals";
    case "debts":
      return "Debts";
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-border last:border-0">
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
        {label}
      </span>
      <span className="text-sm font-semibold text-foreground text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

const FRIENDLY_KEYS: Record<string, string> = {
  name: "Name",
  amount: "Amount",
  newBalance: "New Balance",
  running_total: "New Balance",
  assetName: "Asset",
  categoryName: "Category",
  type: "Type",
  principal: "Principal",
  target_amount: "Target",
  current_amount: "Current",
  planned_amount: "Planned",
  actual_amount: "Actual",
  note: "Note",
  itemName: "Item",
  debtName: "Debt",
  goalName: "Goal",
  totalPaid: "Total Paid",
  newTotal: "New Total",
};

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (
    typeof value === "number" &&
    (key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("balance") ||
      key.toLowerCase().includes("total") ||
      key.toLowerCase().includes("principal") ||
      key === "value")
  ) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return String(value);
}

interface ActivityDetailSheetProps {
  log: ActivityLogRow | null;
  open: boolean;
  onClose: () => void;
}

export default function ActivityDetailSheet({
  log,
  open,
  onClose,
}: ActivityDetailSheetProps) {
  const metadataEntries = log
    ? Object.entries(log.metadata as Record<string, unknown>).filter(
        ([k, v]) =>
          FRIENDLY_KEYS[k] !== undefined &&
          v !== null &&
          v !== undefined &&
          v !== ""
      )
    : [];

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[85dvh] bg-card border-border">
        {log && (
          <>
            <DrawerHeader className="text-left px-5 pt-2 pb-0">
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">
                {categoryLabel(log.category)}
              </p>
              <DrawerTitle className="text-xl font-extrabold tracking-tight text-foreground leading-tight">
                {log.title}
              </DrawerTitle>
              {log.description !== log.title && (
                <DrawerDescription className="text-sm text-muted-foreground mt-1">
                  {log.description}
                </DrawerDescription>
              )}
            </DrawerHeader>

            <div className="overflow-y-auto flex-1 px-5 pb-10 pt-4">
              {metadataEntries.length > 0 && (
                <div className="border border-border rounded-lg px-4 mb-6">
                  {metadataEntries.map(([key, value]) => (
                    <MetadataRow
                      key={key}
                      label={FRIENDLY_KEYS[key]}
                      value={formatValue(key, value)}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MaterialSymbol icon="schedule" size={14} />
                <span>{formatDateTime(log.created_at)}</span>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
