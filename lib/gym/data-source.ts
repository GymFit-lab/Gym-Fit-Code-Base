import { fetchGymData } from "@/app/actions/gym";
import type { GymData } from "@/lib/gym/types";

/**
 * Where the gym records come from — the ONLY file (with the mutations in lib/gym/store.tsx) that
 * knows whether the data is dummy.
 *
 * - remote (AUTH_MODE=fitva): loaded from fitva_db through the Server Actions in app/actions/gym.ts.
 * - otherwise: dummy data from lib/gym/mock-data.ts, kept in the browser's localStorage so records
 *   added in the UI survive a refresh.
 * To retire the dummy data: drop the local branches below, lib/gym/mock-data.ts, the store's
 * `isDemo` flag and components/gym/demo-banner.tsx. No page or component changes are needed.
 */
const STORAGE_KEY = "gymfit:demo-data:v1";

export async function loadGymData(remote: boolean): Promise<GymData> {
  if (remote) return fetchGymData();

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

export function saveGymData(data: GymData, remote: boolean) {
  if (remote) return; // the database is the source of truth
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full/blocked — the in-memory copy still works for this session.
  }
}

/** Throw away local changes and return a fresh dummy seed (remote: just reload). */
export async function resetGymData(remote: boolean): Promise<GymData> {
  if (!remote) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return loadGymData(remote);
}
