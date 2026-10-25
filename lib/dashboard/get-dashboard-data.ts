import { isFitvaAuth } from "@/lib/auth-mode";
import type { DashboardData, DashboardDataSource } from "@/lib/dashboard/types";
import { loadDashboardFromDb } from "@/lib/fitva/dashboard";
import { requireGymId } from "@/lib/session";

/**
 * The ONLY function the dashboard UI uses to get its data.
 *
 * - "db": AUTH_MODE=fitva always reads the signed-in gym from fitva_db (lib/fitva/dashboard.ts).
 * - "api": DASHBOARD_DATA_SOURCE=api → GET {API_BASE_URL}/dashboard returning `DashboardData`.
 * - "mock" (default): dummy data. To retire it, delete lib/dashboard/mock-data.ts and the
 *   `if (dashboardDataSource === "mock")` block.
 * No component changes are needed — components only ever see `DashboardData`.
 */
export const dashboardDataSource: DashboardDataSource = isFitvaAuth
  ? "db"
  : process.env.DASHBOARD_DATA_SOURCE === "api"
    ? "api"
    : "mock";

export async function getDashboardData(): Promise<DashboardData> {
  if (dashboardDataSource === "db") {
    return loadDashboardFromDb(await requireGymId());
  }

  if (dashboardDataSource === "mock") {
    // Dynamic import keeps the dummy data out of the bundle once the API is in use.
    const { getMockDashboardData } = await import("@/lib/dashboard/mock-data");
    return getMockDashboardData();
  }

  return fetchDashboardFromApi();
}

async function fetchDashboardFromApi(): Promise<DashboardData> {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error("DASHBOARD_DATA_SOURCE is 'api' but API_BASE_URL is not set.");
  }

  // TODO(api): forward the user's auth (cookie / bearer token) once the backend defines it.
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/dashboard`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Dashboard API responded ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as DashboardData;
}
