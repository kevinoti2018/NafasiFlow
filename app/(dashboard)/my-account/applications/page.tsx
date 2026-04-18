// app/(dashboard)/applications/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Briefcase,
  Filter,
  Search,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Building2,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  FileText,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useApplications } from "@/hooks/use-application";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type ApplicationWithJob = {
  id: string;
  userId: string;
  jobId: string;
  cvVersionId: string;
  templateId: string | null;
  matchScore: number | null;
  analysisVersion: number | null;
  status: "saved" | "applied" | "interviewing" | "rejected" | "offered";
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  job: {
    id: string;
    title: string | null;
    company: string | null;
    location?: string | null;
    url?: string | null;
  } | null;
};

// Consistent status configuration using primary teal
const statusConfig = {
  saved: {
    color:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    icon: FileText,
    label: "Saved",
    description: "Bookmarked for later",
  },
  applied: {
    color:
      "bg-[#005f78]/10 text-[#005f78] border-[#005f78]/20 dark:bg-[#005f78]/20 dark:text-[#4db8d4] dark:border-[#005f78]/30",
    icon: Briefcase,
    label: "Applied",
    description: "Application submitted",
  },
  interviewing: {
    color:
      "bg-[#005f78]/15 text-[#005f78] border-[#005f78]/25 dark:bg-[#005f78]/25 dark:text-[#4db8d4] dark:border-[#005f78]/40",
    icon: Sparkles,
    label: "Interviewing",
    description: "In interview process",
  },
  offered: {
    color:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle2,
    label: "Offered",
    description: "Job offer received",
  },
  rejected: {
    color:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
    label: "Rejected",
    description: "Not moving forward",
  },
};

export default function ApplicationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useApplications({
    page,
    limit,
    status: status === "all" ? undefined : status,
  });

  const applications = data?.applications || [];
  const pagination = data?.pagination;

  const filteredApps = applications.filter(
    (app: ApplicationWithJob) =>
      app.job?.title?.toLowerCase().includes(search.toLowerCase()) ||
      app.job?.company?.toLowerCase().includes(search.toLowerCase()),
  );

  // Calculate stats
  const totalApps = applications.length;
  const interviewingCount = applications.filter(
    (a: ApplicationWithJob) => a.status === "interviewing",
  ).length;
  const offeredCount = applications.filter(
    (a: ApplicationWithJob) => a.status === "offered",
  ).length;
  const avgMatchScore =
    applications.length > 0
      ? Math.round(
          applications.reduce(
            (acc: number, curr: ApplicationWithJob) =>
              acc + (curr.matchScore || 0),
            0,
          ) / applications.length,
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Applications
            </h1>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
              Track and manage your job applications
            </p>
          </div>
          <Button
            onClick={() => router.push("/my-account/jobs")}
            className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white shadow-lg shadow-[#005f78]/25 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Find Jobs
          </Button>
        </motion.div>

        {/* Stats Overview */}
        {!isLoading && applications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"
          >
            <StatCard
              icon={Briefcase}
              label="Total Applications"
              value={totalApps}
              color="primary"
            />
            <StatCard
              icon={Sparkles}
              label="Interviewing"
              value={interviewingCount}
              color="primary"
              trend={interviewingCount > 0 ? "up" : undefined}
            />
            <StatCard
              icon={CheckCircle2}
              label="Offers"
              value={offeredCount}
              color="success"
              trend={offeredCount > 0 ? "up" : undefined}
            />
            <StatCard
              icon={Target}
              label="Avg Match Score"
              value={`${avgMatchScore}%`}
              color="primary"
              subtext="Across all apps"
            />
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-[#1c2225]">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161b1d]/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl text-slate-900 dark:text-slate-100">
                    Your Applications
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 text-slate-500 dark:text-slate-400">
                    {filteredApps.length}{" "}
                    {filteredApps.length === 1 ? "application" : "applications"}{" "}
                    found
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search jobs..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9 sm:h-10 text-sm bg-white dark:bg-[#161b1d] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10 bg-white dark:bg-[#161b1d] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      <Filter className="h-4 w-4 mr-2 shrink-0 text-slate-500" />
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-700">
                      <SelectItem
                        value="all"
                        className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                      >
                        All statuses
                      </SelectItem>
                      <SelectItem
                        value="saved"
                        className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                      >
                        Saved
                      </SelectItem>
                      <SelectItem
                        value="applied"
                        className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                      >
                        Applied
                      </SelectItem>
                      <SelectItem
                        value="interviewing"
                        className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                      >
                        Interviewing
                      </SelectItem>
                      <SelectItem
                        value="offered"
                        className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                      >
                        Offered
                      </SelectItem>
                      <SelectItem
                        value="rejected"
                        className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                      >
                        Rejected
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 sm:p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-lg bg-slate-200 dark:bg-slate-800" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800" />
                        <Skeleton className="h-3 w-1/4 bg-slate-200 dark:bg-slate-800" />
                      </div>
                      <Skeleton className="h-8 w-24 bg-slate-200 dark:bg-slate-800" />
                    </div>
                  ))}
                </div>
              ) : filteredApps.length === 0 ? (
                <EmptyState
                  search={search}
                  onBrowse={() => router.push("/my-account/jobs")}
                />
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                          <TableHead className="w-[35%] text-slate-500 dark:text-slate-400">
                            Position
                          </TableHead>
                          <TableHead className="w-[15%] text-slate-500 dark:text-slate-400">
                            Match Score
                          </TableHead>
                          <TableHead className="w-[15%] text-slate-500 dark:text-slate-400">
                            Status
                          </TableHead>
                          <TableHead className="w-[15%] text-slate-500 dark:text-slate-400">
                            Applied
                          </TableHead>
                          <TableHead className="w-[20%] text-right text-slate-500 dark:text-slate-400">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {filteredApps.map(
                            (app: ApplicationWithJob, idx: number) => {
                              const statusConfigItem = statusConfig[app.status];
                              const StatusIcon = statusConfigItem.icon;

                              return (
                                <motion.tr
                                  key={app.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="group cursor-pointer border-b border-slate-100 dark:border-slate-800 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/5 transition-colors"
                                  onClick={() =>
                                    router.push(
                                      `/my-account/applications/${app.id}`,
                                    )
                                  }
                                >
                                  <TableCell className="py-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                        <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                          {app.job?.title ||
                                            "Untitled Position"}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-500 truncate">
                                          {app.job?.company ||
                                            "Unknown Company"}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={cn(
                                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                          (app.matchScore || 0) >= 80
                                            ? "bg-[#005f78]/15 text-[#005f78] dark:text-[#4db8d4]"
                                            : (app.matchScore || 0) >= 60
                                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                                        )}
                                      >
                                        {app.matchScore || 0}%
                                      </div>
                                      <div className="w-16 hidden lg:block">
                                        <Progress
                                          value={app.matchScore || 0}
                                          className={cn(
                                            "h-1.5 bg-slate-200 dark:bg-slate-700",
                                            (app.matchScore || 0) >= 80
                                              ? "[&>div]:bg-[#005f78]"
                                              : (app.matchScore || 0) >= 60
                                                ? "[&>div]:bg-amber-500"
                                                : "[&>div]:bg-red-500",
                                          )}
                                        />
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={cn(
                                        "gap-1.5 px-2.5 py-1",
                                        statusConfigItem.color,
                                      )}
                                    >
                                      <StatusIcon className="h-3 w-3" />
                                      {statusConfigItem.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {app.appliedAt
                                        ? format(
                                            new Date(app.appliedAt),
                                            "MMM d, yyyy",
                                          )
                                        : "Not applied"}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(
                                            `/my-account/applications/${app.id}`,
                                          );
                                        }}
                                        className="text-[#005f78] hover:text-[#004a5e] hover:bg-[#005f78]/10 dark:text-[#4db8d4] dark:hover:bg-[#005f78]/10"
                                      >
                                        View
                                        <ArrowRight className="h-4 w-4 ml-1" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              );
                            },
                          )}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
                    <AnimatePresence>
                      {filteredApps.map(
                        (app: ApplicationWithJob, idx: number) => {
                          const statusConfigItem = statusConfig[app.status];
                          const StatusIcon = statusConfigItem.icon;

                          return (
                            <motion.div
                              key={app.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="p-4 active:bg-[#005f78]/5 dark:active:bg-[#005f78]/5 transition-colors"
                              onClick={() =>
                                router.push(
                                  `/my-account/applications/${app.id}`,
                                )
                              }
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                    <Building2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                                      {app.job?.title || "Untitled Position"}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                                      {app.job?.company || "Unknown Company"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge
                                        className={cn(
                                          "gap-1 px-1.5 py-0.5 text-xs",
                                          statusConfigItem.color,
                                        )}
                                      >
                                        <StatusIcon className="h-3 w-3" />
                                        {statusConfigItem.label}
                                      </Badge>
                                      <span
                                        className={cn(
                                          "text-xs font-medium",
                                          (app.matchScore || 0) >= 80
                                            ? "text-[#005f78] dark:text-[#4db8d4]"
                                            : (app.matchScore || 0) >= 60
                                              ? "text-amber-600 dark:text-amber-400"
                                              : "text-red-600 dark:text-red-400",
                                        )}
                                      >
                                        {app.matchScore || 0}% match
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-600 shrink-0" />
                              </div>
                            </motion.div>
                          );
                        },
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161b1d]/50">
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Page {page} of {pagination.totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage(page - 1)}
                          className="h-8 sm:h-9 px-2 sm:px-3 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10"
                        >
                          <ChevronLeft className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= pagination.totalPages}
                          onClick={() => setPage(page + 1)}
                          className="h-8 sm:h-9 px-2 sm:px-3 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="h-4 w-4 sm:ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, trend, subtext }: any) {
  const colorClasses = {
    primary:
      "bg-[#005f78]/10 text-[#005f78] dark:bg-[#005f78]/20 dark:text-[#4db8d4]",
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white dark:bg-[#1c2225]">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "p-1.5 sm:p-2 rounded-lg",
              colorClasses[color as keyof typeof colorClasses],
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          {trend === "up" && (
            <div className="flex items-center text-[#005f78] dark:text-[#4db8d4] text-xs font-medium">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              Active
            </div>
          )}
        </div>
        <div className="mt-2 sm:mt-3">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {label}
          </p>
          {subtext && (
            <p className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {subtext}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  search,
  onBrowse,
}: {
  search: string;
  onBrowse: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        {search ? (
          <Search className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 dark:text-slate-500" />
        ) : (
          <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 dark:text-slate-500" />
        )}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
        {search ? "No matches found" : "No applications yet"}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-2 px-4">
        {search
          ? "Try adjusting your search terms or filters to find what you're looking for."
          : "Start your job search and track your applications here."}
      </p>
      {!search && (
        <Button
          onClick={onBrowse}
          className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white shadow-lg shadow-[#005f78]/25 w-full sm:w-auto mt-4"
        >
          <Plus className="h-4 w-4" />
          Browse Jobs
        </Button>
      )}
    </div>
  );
}
