import { getDB, type SyncQueueItem, type SyncTable } from "@/lib/db";
import {
  addBudgetCategory,
  updateBudgetTotal,
  updateCategoryAllocation,
  updateCategoryIcon,
  updateCategoryName,
  deleteCategory,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  quickLogSpend,
} from "@/lib/actions/budget";
import {
  addGoal,
  updateGoal,
  deleteGoal,
  updateGoalIcon,
} from "@/lib/actions/goals";
import { addAsset, updateAsset, deleteAsset } from "@/lib/actions/net-worth";
import {
  addDebt,
  updateDebt,
  deleteDebt,
  makePayment,
} from "@/lib/actions/debt";

const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function extractTempIds(obj: unknown): string[] {
  const ids: string[] = [];
  const walk = (o: unknown) => {
    if (typeof o === "string" && o.startsWith("temp_")) ids.push(o);
    else if (o && typeof o === "object")
      Object.values(o as object).forEach(walk);
  };
  walk(obj);
  return ids;
}

type Payload = Record<string, unknown>;
type Dispatcher = Record<
  string,
  Record<string, (p: Payload) => Promise<unknown>>
>;

interface SyncCallbacks {
  onPendingChange?: (count: number) => void;
  onRollback?: (item: SyncQueueItem, error: string) => void;
}

export class SyncEngine {
  private isProcessing = false;
  private handleOnline = () => this.processQueue();
  private callbacks: SyncCallbacks = {};

  // Maps each (table, operation) to the corresponding server action call
  private dispatch: Dispatcher = {
    budgets: {
      UPDATE: (p) =>
        updateBudgetTotal(p.budgetId as string, p.totalAmount as number),
    },
    categories: {
      INSERT: (p) =>
        addBudgetCategory(
          p.budgetId as string,
          p.name as string,
          p.type as "needs" | "wants" | "investments" | "misc"
        ),
      UPDATE: (p) => {
        const u = p.updates as Record<string, unknown>;
        if (u.icon !== undefined)
          return updateCategoryIcon(p.categoryId as string, u.icon as string);
        if (u.name !== undefined)
          return updateCategoryName(p.categoryId as string, u.name as string);
        if (u.allocated_amount !== undefined)
          return updateCategoryAllocation(
            p.categoryId as string,
            u.allocated_amount as number
          );
        return Promise.reject(new Error("Unknown category update payload"));
      },
      DELETE: (p) => deleteCategory(p.categoryId as string),
    },
    budget_items: {
      INSERT: (p) =>
        addBudgetItem(
          p.categoryId as string,
          p.name as string,
          (p.planned as number) ?? 0
        ),
      UPDATE: (p) =>
        updateBudgetItem(
          p.itemId as string,
          p.updates as Parameters<typeof updateBudgetItem>[1]
        ),
      DELETE: (p) => deleteBudgetItem(p.itemId as string),
      PAYMENT: (p) => quickLogSpend(p.itemId as string, p.amount as number),
    },
    goals: {
      INSERT: (p) => addGoal(p.name as string, p.targetAmount as number),
      UPDATE: (p) => {
        const u = p.updates as Record<string, unknown>;
        if (u.icon !== undefined)
          return updateGoalIcon(p.id as string, u.icon as string);
        return updateGoal(
          p.id as string,
          u as Parameters<typeof updateGoal>[1]
        );
      },
      DELETE: (p) => deleteGoal(p.id as string),
    },
    assets: {
      INSERT: (p) =>
        addAsset(p.name as string, p.category as string, p.value as number),
      UPDATE: (p) =>
        updateAsset(
          p.id as string,
          p.updates as Parameters<typeof updateAsset>[1]
        ),
      DELETE: (p) => deleteAsset(p.id as string),
    },
    debts: {
      INSERT: (p) =>
        addDebt(
          p.name as string,
          p.type as "internal" | "external" | "lent",
          p.principal as number,
          p.interestRate as number,
          p.monthlyMin as number,
          (p.expectedPayoffDate as string | null) ?? null
        ),
      UPDATE: (p) =>
        updateDebt(
          p.id as string,
          p.updates as Parameters<typeof updateDebt>[1]
        ),
      DELETE: (p) => deleteDebt(p.id as string),
      PAYMENT: (p) => makePayment(p.id as string, p.amount as number),
    },
  };

  /**
   * Register (or clear) runtime callbacks.
   * Called from the SyncProvider effect — safe to call at any time.
   */
  setCallbacks(cbs: SyncCallbacks): void {
    this.callbacks = cbs;
  }

  start(): void {
    window.addEventListener("online", this.handleOnline);
    if (navigator.onLine) this.processQueue();
  }

  stop(): void {
    window.removeEventListener("online", this.handleOnline);
    this.callbacks = {};
  }

  async enqueue(
    item: Omit<SyncQueueItem, "id" | "retries" | "status" | "createdAt">
  ): Promise<void> {
    const db = getDB();
    await db.sync_queue.add({
      ...item,
      retries: 0,
      status: "pending",
      createdAt: Date.now(),
    });
    await this.notifyPendingChange();
    if (navigator.onLine && !this.isProcessing) {
      this.processQueue();
    }
  }

  async getPendingCount(): Promise<number> {
    const db = getDB();
    return db.sync_queue
      .where("status")
      .anyOf(["pending", "processing"])
      .count();
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;
    this.isProcessing = true;

    try {
      const db = getDB();

      while (true) {
        const items = await db.sync_queue
          .where("status")
          .equals("pending")
          .sortBy("createdAt");

        const item = items[0];
        if (!item || item.id === undefined) break;

        const blocked = await this.hasUnresolvedDependencies(item);
        if (blocked) break;

        await db.sync_queue.update(item.id, { status: "processing" });
        await this.notifyPendingChange();

        const resolvedPayload = await this.resolvePayload(item.payload);

        try {
          const result = await this.executeItem(item, resolvedPayload);

          if (item.operation === "INSERT" && item.tempId) {
            const realId = (result as Record<string, unknown>)?.id as
              | string
              | undefined;
            if (realId && realId !== item.tempId) {
              await db.id_map.put({
                tempId: item.tempId,
                realId,
                table: item.table,
              });
              await this.replaceIDBRecord(
                item.table,
                item.tempId,
                realId,
                result as Record<string, unknown>
              );
            }
          }

          await db.sync_queue.update(item.id, { status: "done" });
          await this.notifyPendingChange();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "Sync failed";
          const nextRetries = item.retries + 1;

          if (nextRetries >= MAX_RETRIES) {
            await db.sync_queue.update(item.id, {
              status: "failed",
              lastError: errMsg,
            });
            await this.rollback(item);
            this.callbacks.onRollback?.(item, errMsg);
            await this.notifyPendingChange();
          } else {
            await db.sync_queue.update(item.id, {
              status: "pending",
              retries: nextRetries,
              lastError: errMsg,
            });
            const backoffMs = Math.pow(2, nextRetries) * 1000;
            await sleep(backoffMs);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async hasUnresolvedDependencies(
    item: SyncQueueItem
  ): Promise<boolean> {
    const tempIds = extractTempIds(item.payload);
    if (tempIds.length === 0) return false;
    const db = getDB();
    for (const tempId of tempIds) {
      const mapping = await db.id_map.get(tempId);
      if (!mapping) return true;
    }
    return false;
  }

  private async resolvePayload(payload: Payload): Promise<Payload> {
    const db = getDB();
    const resolve = async (obj: unknown): Promise<unknown> => {
      if (typeof obj === "string" && obj.startsWith("temp_")) {
        const mapping = await db.id_map.get(obj);
        return mapping ? mapping.realId : obj;
      }
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        const out: Payload = {};
        for (const [k, v] of Object.entries(obj as Payload)) {
          out[k] = await resolve(v);
        }
        return out;
      }
      if (Array.isArray(obj)) return Promise.all(obj.map(resolve));
      return obj;
    };
    return resolve(payload) as Promise<Payload>;
  }

  private async executeItem(
    item: SyncQueueItem,
    resolvedPayload: Payload
  ): Promise<unknown> {
    const tableDispatch = this.dispatch[item.table];
    if (!tableDispatch)
      throw new Error(`No dispatch registered for table: ${item.table}`);
    const opDispatch = tableDispatch[item.operation];
    if (!opDispatch)
      throw new Error(
        `No dispatch for ${item.operation} on ${item.table}`
      );
    return opDispatch(resolvedPayload);
  }

  private async replaceIDBRecord(
    table: SyncTable,
    tempId: string,
    realId: string,
    serverRecord: Record<string, unknown>
  ): Promise<void> {
    const db = getDB();
    const tbl = db.table(table);
    await tbl.delete(tempId);
    await tbl.put({ ...serverRecord, id: realId });
  }

  private async rollback(item: SyncQueueItem): Promise<void> {
    if (item.operation !== "INSERT") return;
    const db = getDB();
    await db.table(item.table).delete(item.recordId);
  }

  private async notifyPendingChange(): Promise<void> {
    if (!this.callbacks.onPendingChange) return;
    const count = await this.getPendingCount();
    this.callbacks.onPendingChange(count);
  }
}
