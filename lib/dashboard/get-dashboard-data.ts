import type { DashboardData, DashboardDataSource } from "@/lib/dashboard/types";

/**
 * The ONLY function the dashboard UI uses to get its data.
 *
 * Today it returns dummy data. When the backend is ready:
 *   1. Set DASHBOARD_DATA_SOURCE=api and API_BASE_URL in your env (or just delete the mock branch).
 *   2. Make sure GET {API_BASE_URL}/dashboard returns `DashboardData` (lib/dashboard/types.ts).
 *   3. Delete lib/dashboard/mock-data.ts and the `if (dashboardDataSource === "mock")` block.
 * No component changes are needed — components only ever see `DashboardData`.
 */
export const dashboardDataSource: DashboardDataSource =
  process.env.DASHBOARD_DATA_SOURCE === "api" ? "api" : "mock";

export async function getDashboardData(): Promise<DashboardData> {
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
