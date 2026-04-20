// lib/services/dashboard.service.ts
export const DashboardService = {
  getStats: async () => {
    const response = await fetch("/api/dashboard/stats");
    const result = await response.json();
    if (!response.ok)
      throw new Error(result.error || "Failed to fetch dashboard stats");
    return result;
  },
};
