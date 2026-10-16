import type { GymData } from "@/lib/gym/types";

/**
 * Where the gym records come from — the ONLY file (with the mutations in lib/gym/store.tsx) that
 * knows the data is dummy.
 *
 * Today: dummy data from lib/gym/mock-data.ts, kept in the browser's localStorage so records added
 * in the UI survive a refresh. When the backend is ready:
 *   1. Make `loadGymData` fetch from the API (and return `GymData`, lib/gym/types.ts).
 *   2. Replace the state updates in lib/gym/store.tsx with API calls (create → refetch/merge).
 *   3. Delete this file's localStorage code, lib/gym/mock-data.ts, `isDemoData` and
 *      components/gym/demo-banner.tsx. No page or component changes are needed.
 */
export const isDemoData = true;

const STORAGE_KEY = "gymfit:demo-data:v1";

export async function loadGymData(): Promise<GymData> {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as GymData;
  } catch {
    // Storage blocked or corrupted — fall through to a fresh seed.
  }
  // Dynamic import keeps the dummy data out of the bundle once the API is in use.
  const { createMockGymData } = await import("@/lib/gym/mock-data");
  return createMockGymData();
}

export function saveGymData(data: GymData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full/blocked — the in-memory copy still works for this session.
  }
}

/** Throw away local changes and return a fresh dummy seed. */
export async function resetGymData(): Promise<GymData> {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return loadGymData();
}
