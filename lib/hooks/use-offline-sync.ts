"use client";

import { useEffect } from "react";
import { useCreate } from "@refinedev/core";
import { useOfflineQueue } from "@/lib/stores/offline-queue";

/**
 * Mount this hook anywhere inside the Refine provider tree to automatically
 * drain the offline queue whenever the device comes (back) online.
 *
 * Items with ≥ 3 failed attempts are skipped to avoid infinite retry loops.
 */
export function useOfflineSync() {
  const { items, dequeue, markAttempt } = useOfflineQueue();
  const { mutateAsync: create } = useCreate();

  useEffect(() => {
    const process = async () => {
      if (!navigator.onLine || items.length === 0) return;

      for (const item of items) {
        if (item.attempts >= 3) continue;
        markAttempt(item.id);
        try {
          await create({
            resource: item.resource,
            values: item.payload,
            successNotification: false,
          });
          dequeue(item.id);
        } catch {
          // will retry on next "online" event or page load
        }
      }
    };

    window.addEventListener("online", process);
    process();
    return () => window.removeEventListener("online", process);
  }, [items, create, dequeue, markAttempt]);
}
