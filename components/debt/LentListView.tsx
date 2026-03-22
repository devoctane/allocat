"use client";

import { useState } from "react";
import { InlineEditableText } from "@/components/ui/InlineEditableText";
import { InlineEditableNumber } from "@/components/ui/InlineEditableNumber";
import EmojiPickerModal from "@/components/ui/EmojiPickerModal";
import { ConfirmDrawer } from "@/components/ui/ConfirmDrawer";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { useAddDebt, useUpdateDebt, useDeleteDebt, useMakePayment, useUpdateDebtIcon } from "@/lib/hooks/useDebt";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Same Debt type as in DebtPage
type Debt = {
  id: string;
  name: string;
  icon?: string | null;
  type: "internal" | "external" | "lent";
  principal: number;
  interestRate: number;
  monthlyMin: number;
  totalPaid: number;
  expectedPayoffDate?: string | null;
  isClosed: boolean;
};

export default function LentListView({ lents, onBack }: { lents: Debt[], onBack: () => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [pickerLentId, setPickerLentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<Record<string, string>>({});
  const [lentToDelete, setLentToDelete] = useState<string | null>(null);
  
  const haptic = useHaptic();
  const addDebtMutation = useAddDebt();
  const updateDebtMutation = useUpdateDebt();
  const deleteDebtMutation = useDeleteDebt();
  const makePaymentMutation = useMakePayment();
  const updateDebtIconMutation = useUpdateDebtIcon();

  const [newLent, setNewLent] = useState({
    name: "",
    principal: "",
    expectedPayoffDate: "",
  });

  const activeLents = lents.filter((d) => !d.isClosed);
  const closedLents = lents.filter((d) => d.isClosed);

  function handleAddLent() {
    const principal = parseFloat(newLent.principal);
    if (!newLent.name.trim() || isNaN(principal) || principal <= 0) return;
    
    haptic.success();
    addDebtMutation.mutate(
      { 
        name: newLent.name.trim(), 
        type: "lent", 
        principal, 
        interestRate: 0, 
        monthlyMin: 0, 
        expectedPayoffDate: newLent.expectedPayoffDate || null 
      },
      {
        onSuccess: () => {
          setNewLent({ name: "", principal: "", expectedPayoffDate: "" });
          setShowAddForm(false);
        },
      }
    );
  }

  function handleUpdateLent(id: string, updates: Partial<Debt>) {
    updateDebtMutation.mutate({ id, updates });
  }

  function handleDeleteLent(id: string) {
    haptic.light();
    setLentToDelete(id);
  }

  function handleMakePayment(id: string) {
    const amount = parseFloat(paymentAmount[id] || "0");
    if (isNaN(amount) || amount <= 0) return;

    haptic.success();
    makePaymentMutation.mutate(
      { id, amount },
      { onSuccess: () => setPaymentAmount(prev => ({ ...prev, [id]: "" })) }
    );
  }

  function handleUpdateIcon(id: string, icon: string) {
    updateDebtIconMutation.mutate({ id, icon });
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { haptic.light(); onBack(); }} className="p-2 -ml-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Money Out to Friends</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Active Lends</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-[11px] font-bold text-foreground flex items-center gap-1 transition-transform active:scale-95 bg-muted px-3 py-1.5 rounded-full hover:bg-muted/80"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            NEW
          </button>
        </div>

        {activeLents.length === 0 && !showAddForm && (
          <p className="text-sm text-muted-foreground text-center py-8">No friends owe you money right now.</p>
        )}

        {showAddForm && (
          <div className="p-4 bg-card border border-border rounded-xl space-y-3">
            <h4 className="text-sm font-bold text-foreground">New Lend</h4>
            <input
              type="text"
              placeholder="Friend's Name"
              value={newLent.name}
              onChange={(e) => setNewLent((p) => ({ ...p, name: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              min="0"
              placeholder="Amount Given (₹)"
              value={newLent.principal}
              onChange={(e) => setNewLent((p) => ({ ...p, principal: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Expected Back Date (Optional)</label>
              <input
                type="date"
                value={newLent.expectedPayoffDate}
                onChange={(e) => setNewLent((p) => ({ ...p, expectedPayoffDate: e.target.value }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddLent}
                className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg active:scale-95 transition-transform"
              >
                Save
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 bg-muted text-foreground text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeLents.map((lent) => {
          const remaining = lent.principal - lent.totalPaid;
          return (
            <div key={lent.id} className="group bg-card border border-border p-4 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setPickerLentId(lent.id)}
                    className="flex items-center justify-center size-10 rounded-full bg-muted hover:bg-muted/80 transition-colors text-xl shrink-0"
                    title="Set Emoji"
                  >
                    {lent.icon
                      ? <span className="grayscale">{lent.icon}</span>
                      : <span className="material-symbols-outlined text-base text-muted-foreground">face</span>
                    }
                  </button>
                  <div>
                    <h4 className="font-bold text-base text-foreground">
                      <InlineEditableText
                        value={lent.name}
                        onSave={(val) => handleUpdateLent(lent.id, { name: val })}
                      />
                    </h4>
                    {lent.expectedPayoffDate && (
                      <p className="text-[10px] uppercase text-muted-foreground mt-0.5 tracking-wider font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                        Expected: {new Date(lent.expectedPayoffDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-base font-bold tabular-nums text-emerald-400 block">
                      <InlineEditableNumber
                        value={remaining}
                        onSave={(val) => handleUpdateLent(lent.id, { principal: val + lent.totalPaid })}
                        formatAsCurrency={true}
                      />
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Remaining</span>
                  </div>
                  <button
                    onClick={() => handleDeleteLent(lent.id)}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                    title="Delete Record"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>

              {/* Quick Log Payment for Lends */}
              <div className="mt-4 flex gap-2 pt-3 border-t border-border">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-xs">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Received amount"
                    value={paymentAmount[lent.id] || ""}
                    onChange={(e) => setPaymentAmount(prev => ({ ...prev, [lent.id]: e.target.value }))}
                    className="w-full pl-6 pr-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  onClick={() => handleMakePayment(lent.id)}
                  disabled={!paymentAmount[lent.id] || isNaN(parseFloat(paymentAmount[lent.id] || "0")) || parseFloat(paymentAmount[lent.id]) <= 0}
                  className="px-4 py-2 bg-muted text-emerald-400 text-sm font-semibold rounded-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all hover:bg-muted/80"
                >
                  Log Payment
                </button>
              </div>
            </div>
          );
        })}

        {closedLents.length > 0 && (
          <div className="mt-8 space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Settled (Paid Back)</h3>
            {closedLents.map((lent) => (
              <div key={lent.id} className="bg-card/50 border border-border p-3 rounded-xl opacity-60 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <span className="size-8 rounded-full bg-muted flex items-center justify-center text-sm grayscale">{lent.icon || '✅'}</span>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{lent.name}</h4>
                    <span className="text-[10px] text-muted-foreground">Total: {formatCurrency(lent.principal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteLent(lent.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity p-2"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <EmojiPickerModal
        isOpen={pickerLentId !== null}
        onClose={() => setPickerLentId(null)}
        onSelect={(emoji) => {
          if (pickerLentId) handleUpdateIcon(pickerLentId, emoji);
        }}
      />

      <ConfirmDrawer
        isOpen={lentToDelete !== null}
        onClose={() => setLentToDelete(null)}
        onConfirm={() => {
          if (lentToDelete) {
            deleteDebtMutation.mutate(lentToDelete);
            setLentToDelete(null);
          }
        }}
        title="Delete Record"
        description="Are you sure you want to delete this lend record? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
