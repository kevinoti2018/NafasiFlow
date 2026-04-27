// hooks/use-dashboard.ts
import { useQuery } from "@tanstack/react-query";
import { DashboardService } from "@/services/dashboard.service";

export const dashboardKeys = {
  stats: ["dashboard", "stats"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => DashboardService.getStats(),
  });
}
