import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface QueuedItem {
  id: string;
  resource: string;
  payload: Record<string, unknown>;
  createdAt: string;
  attempts: number;
}

interface OfflineQueueState {
  items: QueuedItem[];
  /** Add an item to the queue and request a background sync if available. Returns the local id. */
  enqueue: (resource: string, payload: Record<string, unknown>) => string;
  dequeue: (id: string) => void;
  markAttempt: (id: string) => void;
  clear: () => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set) => ({
      items: [],

      enqueue: (resource, payload) => {
        const id = crypto.randomUUID();
        set((state) => ({
          items: [
            ...state.items,
            { id, resource, payload, createdAt: new Date().toISOString(), attempts: 0 },
          ],
        }));
        // Kick off a background sync so the SW can retry when the device comes online
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          navigator.serviceWorker.ready
            .then((sw) =>
              (
                sw as unknown as { sync: { register: (tag: string) => Promise<void> } }
              ).sync.register("sync-invoices")
            )
            .catch(() => {});
        }
        return id;
      },

      dequeue: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      markAttempt: (id) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, attempts: i.attempts + 1 } : i)),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: "snapdocket-offline-queue",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : (null as never)
      ),
    }
  )
);
