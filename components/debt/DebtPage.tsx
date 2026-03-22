"use client";

import { useState, useEffect } from "react";
import DebtEmptyState from "./DebtEmptyState";
import { InlineEditableText } from "@/components/ui/InlineEditableText";
import { InlineEditableNumber } from "@/components/ui/InlineEditableNumber";
import EmojiPickerModal from "@/components/ui/EmojiPickerModal";
import { BottomSheetSelect } from "@/components/ui/BottomSheetSelect";
import { ConfirmDrawer } from "@/components/ui/ConfirmDrawer";
import { useHaptic } from "@/lib/hooks/useHaptic";
import { useAddDebt, useUpdateDebt, useDeleteDebt, useMakePayment, useUpdateDebtIcon } from "@/lib/hooks/useDebt";
import LentListView from "./LentListView";

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

const DEBT_TYPE_OPTIONS = [
  { value: "external" as const, label: "External", description: "Bank loans, credit cards, etc." },
  { value: "internal" as const, label: "Internal", description: "Family, friends, personal" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DebtPage({ data }: { data: Debt[] }) {
  const [activeTab, setActiveTab] = useState<"internal" | "external">("external");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDebtId, setPaymentDebtId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [pickerDebtId, setPickerDebtId] = useState<string | null>(null);
  const [showLentList, setShowLentList] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const haptic = useHaptic();

  const addDebtMutation = useAddDebt();
  const updateDebtMutation = useUpdateDebt();
  const deleteDebtMutation = useDeleteDebt();
  const makePaymentMutation = useMakePayment();
  const updateDebtIconMutation = useUpdateDebtIcon();

  const [newDebt, setNewDebt] = useState({
    name: "",
    type: "external" as "internal" | "external",
    principal: "",
    interestRate: "",
    monthlyMin: "",
  });

  const activeDebts = data.filter((d) => !d.isClosed && d.type === activeTab);
  const closedDebts = data.filter((d) => d.isClosed && d.type === activeTab);
  const totalOutstanding = data.filter((d) => !d.isClosed && d.type !== "lent").reduce((s, d) => s + (d.principal - d.totalPaid), 0);
  
  const lents = data.filter(d => d.type === "lent");
  const totalLent = lents.filter(d => !d.isClosed).reduce((s, d) => s + (d.principal - d.totalPaid), 0);

  const avgInterest =
    data.filter((d) => !d.isClosed && d.type !== "lent" && d.interestRate > 0).reduce((s, d) => s + d.interestRate, 0) /
    (data.filter((d) => !d.isClosed && d.type !== "lent" && d.interestRate > 0).length || 1);

  // Auto-select first active debt for Quick Payment
  useEffect(() => {
    if (!activeDebts.find((d) => d.id === paymentDebtId)) {
      const id = setTimeout(() => {
        setPaymentDebtId(activeDebts.length > 0 ? activeDebts[0].id : "");
      }, 0);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function handleAddDebt() {
    const principal = parseFloat(newDebt.principal);
    const interest = parseFloat(newDebt.interestRate || "0");
    const monthly = parseFloat(newDebt.monthlyMin || "0");
    if (!newDebt.name.trim() || isNaN(principal) || principal <= 0) return;
    
    haptic.success();
    addDebtMutation.mutate(
      { name: newDebt.name.trim(), type: newDebt.type, principal, interestRate: interest, monthlyMin: monthly },
      {
        onSuccess: () => {
          setNewDebt({ name: "", type: "external", principal: "", interestRate: "", monthlyMin: "" });
          setShowAddForm(false);
        },
      }
    );
  }

  function handleDeleteDebt(id: string) {
    haptic.light();
    setDebtToDelete(id);
  }

  function handleUpdateDebt(id: string, updates: { name?: string; principal?: number; interest_rate?: number; monthly_minimum?: number }) {
    updateDebtMutation.mutate({ id, updates });
  }

  function handleMakePayment() {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0 || !paymentDebtId) return;

    haptic.success();
    makePaymentMutation.mutate(
      { id: paymentDebtId, amount },
      { onSuccess: () => setPaymentAmount("") }
    );
  }

  function handleUpdateDebtIcon(id: string, icon: string) {
    updateDebtIconMutation.mutate({ id, icon });
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md px-4 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Debt Management</h1>
          <button id="debt-more" className="p-2 hover:bg-muted rounded-full">
            <span className="material-symbols-outlined text-foreground text-xl">more_vert</span>
          </button>
        </div>
      </header>

      <main className="px-4 pb-6 transition-opacity">
        {showLentList ? (
          <LentListView lents={lents} onBack={() => setShowLentList(false)} />
        ) : data.filter(d => d.type !== "lent").length === 0 && lents.length === 0 ? (
          <>
            {showAddForm ? (
               <div className="mt-6 p-4 bg-card border border-border rounded-xl space-y-3">
               <h4 className="text-sm font-bold text-foreground">New Debt</h4>
               <input
                 id="new-debt-name"
                 type="text"
                 placeholder="Name (e.g. Car Loan)"
                 value={newDebt.name}
                 onChange={(e) => setNewDebt((p) => ({ ...p, name: e.target.value }))}
                 className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
               />
               <div className="grid grid-cols-2 gap-3">
                 <input
                   id="new-debt-principal"
                   type="number"
                   min="0"
                   placeholder="Principal (₹)"
                   value={newDebt.principal}
                   onChange={(e) => setNewDebt((p) => ({ ...p, principal: e.target.value }))}
                   className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                 />
                 <input
                   id="new-debt-interest"
                   type="number"
                   min="0"
                   placeholder="Interest (%)"
                   value={newDebt.interestRate}
                   onChange={(e) => setNewDebt((p) => ({ ...p, interestRate: e.target.value }))}
                   className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                 />
               </div>
               <input
                 id="new-debt-monthly"
                 type="number"
                 min="0"
                 placeholder="Monthly minimum (₹)"
                 value={newDebt.monthlyMin}
                 onChange={(e) => setNewDebt((p) => ({ ...p, monthlyMin: e.target.value }))}
                 className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
               />
               <BottomSheetSelect
                 id="new-debt-type"
                 title="Debt Type"
                 options={DEBT_TYPE_OPTIONS}
                 value={newDebt.type}
                 onChange={(val) => setNewDebt((p) => ({ ...p, type: val }))}
               />
               <div className="flex gap-2">
                 <button
                   id="save-new-debt"
                   onClick={handleAddDebt}
                   className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg active:scale-95 transition-transform"
                 >
                   Save
                 </button>
                 <button
                   id="cancel-new-debt"
                   onClick={() => setShowAddForm(false)}
                   className="flex-1 py-2.5 bg-muted text-foreground text-sm font-medium rounded-lg transition-colors"
                 >
                   Cancel
                 </button>
               </div>
             </div>
            ) : (
              <DebtEmptyState onAddDebt={() => setShowAddForm(true)} />
            )}
          </>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              {/* Total Outstanding */}
              <div className="bg-card border border-border p-5 rounded-xl">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                  Total Outstanding
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
                    {formatCurrency(totalOutstanding)}
                  </span>
                </div>
              </div>
              
              {/* Total Lent out to friends */}
              <div 
                onClick={() => {
                  haptic.light();
                  setShowLentList(true);
                }}
                className="bg-card border border-border p-5 rounded-xl cursor-pointer hover:bg-muted/50 active:scale-95 transition-all text-left"
              >
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-500 mb-1">Money Out to Friends</p>
                  <span className="material-symbols-outlined text-[14px] text-muted-foreground">arrow_forward_ios</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight tabular-nums text-emerald-400">
                    {formatCurrency(totalLent)}
                  </span>
                </div>
              </div>
              
              {/* Interest Rate */}
              <div className="bg-card border border-border p-4 rounded-xl">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Interest Rate</p>
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {avgInterest.toFixed(1)}%{" "}
                  <span className="text-xs font-normal text-muted-foreground">Avg</span>
                </p>
              </div>
              {/* Payoff Trend */}
              <div className="bg-card border border-border p-4 rounded-xl">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Payoff Trend</p>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-foreground">trending_down</span>
                  <p className="text-xl font-semibold tracking-tight text-foreground">2.4%</p>
                </div>
              </div>
            </div>

            {/* Internal / External Toggle */}
            <div className="mt-6">
              <div className="flex p-1 bg-muted rounded-xl">
                {(["internal", "external"] as const).map((tab) => (
                  <button
                    key={tab}
                    id={`debt-tab-${tab}`}
                    onClick={() => {
                      haptic.light();
                      setActiveTab(tab);
                    }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all ${
                      activeTab === tab
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Payment */}
            {activeDebts.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Quick Payment</h3>
                <div className="bg-card border border-border p-4 rounded-xl flex flex-col gap-3">
                  <BottomSheetSelect
                    title="Select Debt"
                    options={activeDebts.map((d) => ({
                      value: d.id,
                      label: d.name,
                      description: formatCurrency(d.principal - d.totalPaid) + " remaining",
                      icon: d.icon ?? undefined,
                    }))}
                    value={paymentDebtId}
                    onChange={setPaymentDebtId}
                  />
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                      <input
                        id="quick-payment-input"
                        type="number"
                        min="0"
                        placeholder="0.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <button
                      id="pay-now-button"
                      onClick={handleMakePayment}
                      disabled={!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0}
                      className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Debts */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Active Debts</h3>
                <button
                  id="add-debt-button"
                  onClick={() => setShowAddForm(true)}
                  className="text-[11px] font-bold text-foreground flex items-center gap-1 transition-transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  ADD NEW
                </button>
              </div>

              {activeDebts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No {activeTab} debts recorded.</p>
              )}

              {activeDebts.map((debt) => {
                const remaining = debt.principal - debt.totalPaid;
                const paidPct = debt.principal > 0 ? Math.round((debt.totalPaid / debt.principal) * 100) : 0;
                return (
                  <div
                    key={debt.id}
                    className="group bg-card border border-border p-4 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => setPickerDebtId(debt.id)}
                          className="flex items-center justify-center size-8 mt-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-lg shrink-0"
                          title="Set Emoji"
                        >
                          {debt.icon
                            ? <span className="grayscale">{debt.icon}</span>
                            : <span className="material-symbols-outlined text-sm text-muted-foreground">add_reaction</span>
                          }
                        </button>
                        <div>
                          <h4 className="font-bold text-base text-foreground">
                            <InlineEditableText
                              value={debt.name}
                              onSave={(val) => handleUpdateDebt(debt.id, { name: val })}
                            />
                          </h4>
                          <p className="text-xs flex items-center gap-1 text-muted-foreground mt-1">
                            Int: <InlineEditableNumber value={debt.interestRate} onSave={(val) => handleUpdateDebt(debt.id, { interest_rate: val })} className="text-xs border-none" />% • Min: <InlineEditableNumber value={debt.monthlyMin} onSave={(val) => handleUpdateDebt(debt.id, { monthly_minimum: val })} formatAsCurrency={true} className="text-xs border-none" />
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          <InlineEditableNumber
                            value={remaining}
                            onSave={(val) => handleUpdateDebt(debt.id, { principal: val + debt.totalPaid })}
                            formatAsCurrency={true}
                          />
                        </span>
                        <button
                          id={`delete-debt-${debt.id}`}
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                          title="Delete Debt"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${paidPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                        {paidPct}% PAID OFF
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                        REMAINING: {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Closed Debts */}
            {closedDebts.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Closed Debts</h3>
                {closedDebts.map((debt) => (
                  <div key={debt.id} className="bg-card/50 border border-border p-4 rounded-xl opacity-50 relative group">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-sm text-foreground">{debt.name}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Paid Off</span>
                        <button
                          id={`delete-debt-closed-${debt.id}`}
                          onClick={() => handleDeleteDebt(debt.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
                          title="Delete Record"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Debt Form (if showing while debts exist) */}
            {showAddForm && (
              <div className="mt-6 p-4 bg-card border border-border rounded-xl space-y-3">
                <h4 className="text-sm font-bold text-foreground">New Debt</h4>
                <input
                  id="new-debt-name-bottom"
                  type="text"
                  placeholder="Name (e.g. Car Loan)"
                  value={newDebt.name}
                  onChange={(e) => setNewDebt((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    id="new-debt-principal-bottom"
                    type="number"
                    min="0"
                    placeholder="Principal (₹)"
                    value={newDebt.principal}
                    onChange={(e) => setNewDebt((p) => ({ ...p, principal: e.target.value }))}
                    className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    id="new-debt-interest-bottom"
                    type="number"
                    min="0"
                    placeholder="Interest (%)"
                    value={newDebt.interestRate}
                    onChange={(e) => setNewDebt((p) => ({ ...p, interestRate: e.target.value }))}
                    className="bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <input
                  id="new-debt-monthly-bottom"
                  type="number"
                  min="0"
                  placeholder="Monthly minimum (₹)"
                  value={newDebt.monthlyMin}
                  onChange={(e) => setNewDebt((p) => ({ ...p, monthlyMin: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <BottomSheetSelect
                   id="new-debt-type-bottom"
                   title="Debt Type"
                   options={DEBT_TYPE_OPTIONS}
                   value={newDebt.type}
                   onChange={(val) => setNewDebt((p) => ({ ...p, type: val }))}
                 />
                <div className="flex gap-2">
                  <button
                    id="save-new-debt-bottom"
                    onClick={handleAddDebt}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg active:scale-95 transition-transform"
                  >
                    Save
                  </button>
                  <button
                    id="cancel-new-debt-bottom"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2.5 bg-muted text-foreground text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <EmojiPickerModal
        isOpen={pickerDebtId !== null}
        onClose={() => setPickerDebtId(null)}
        onSelect={(emoji) => {
          if (pickerDebtId) handleUpdateDebtIcon(pickerDebtId, emoji);
        }}
      />

      <ConfirmDrawer
        isOpen={debtToDelete !== null}
        onClose={() => setDebtToDelete(null)}
        onConfirm={() => {
          if (debtToDelete) {
            deleteDebtMutation.mutate(debtToDelete);
            setDebtToDelete(null);
          }
        }}
        title="Delete Debt"
        description="Are you sure you want to delete this debt? This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
}
