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

const statusConfig = {
  saved: {
    color:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    icon: FileText,
    label: "Saved",
    description: "Bookmarked for later",
  },
  applied: {
    color:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    icon: Briefcase,
    label: "Applied",
    description: "Application submitted",
  },
  interviewing: {
    color:
      "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300",
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
    <div className="min-h-screen bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-950 dark:to-slate-900">
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
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track and manage your job applications
            </p>
          </div>
          <Button
            onClick={() => router.push("/my-account/jobs")}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 w-full sm:w-auto"
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
              color="blue"
            />
            <StatCard
              icon={Sparkles}
              label="Interviewing"
              value={interviewingCount}
              color="violet"
              trend={interviewingCount > 0 ? "up" : undefined}
            />
            <StatCard
              icon={CheckCircle2}
              label="Offers"
              value={offeredCount}
              color="emerald"
              trend={offeredCount > 0 ? "up" : undefined}
            />
            <StatCard
              icon={Target}
              label="Avg Match Score"
              value={`${avgMatchScore}%`}
              color="amber"
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
          <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6 border-b bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">
                    Your Applications
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {filteredApps.length}{" "}
                    {filteredApps.length === 1 ? "application" : "applications"}{" "}
                    found
                  </CardDescription>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search jobs..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9 sm:h-10 text-sm"
                    />
                  </div>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 sm:h-10">
                      <Filter className="h-4 w-4 mr-2 shrink-0" />
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="saved">Saved</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="interviewing">Interviewing</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
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
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-8 w-24" />
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
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[35%]">Position</TableHead>
                          <TableHead className="w-[15%]">Match Score</TableHead>
                          <TableHead className="w-[15%]">Status</TableHead>
                          <TableHead className="w-[15%]">Applied</TableHead>
                          <TableHead className="w-[20%] text-right">
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
                                  className="group cursor-pointer border-b hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                  onClick={() =>
                                    router.push(
                                      `/my-account/applications/${app.id}`,
                                    )
                                  }
                                >
                                  <TableCell className="py-4">
                                    <div className="flex items-start gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0">
                                        <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                          {app.job?.title ||
                                            "Untitled Position"}
                                        </p>
                                        <p className="text-sm text-muted-foreground truncate">
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
                                            ? "bg-emerald-100 text-emerald-700"
                                            : (app.matchScore || 0) >= 60
                                              ? "bg-amber-100 text-amber-700"
                                              : "bg-red-100 text-red-700",
                                        )}
                                      >
                                        {app.matchScore || 0}%
                                      </div>
                                      <div className="w-16 hidden lg:block">
                                        <Progress
                                          value={app.matchScore || 0}
                                          className={cn(
                                            "h-1.5",
                                            (app.matchScore || 0) >= 80
                                              ? "bg-emerald-100 [&>div]:bg-emerald-500"
                                              : (app.matchScore || 0) >= 60
                                                ? "bg-amber-100 [&>div]:bg-amber-500"
                                                : "bg-red-100 [&>div]:bg-red-500",
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
                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
                              className="p-4 active:bg-slate-50 dark:active:bg-slate-900/50 transition-colors"
                              onClick={() =>
                                router.push(
                                  `/my-account/applications/${app.id}`,
                                )
                              }
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0">
                                    <Building2 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                                      {app.job?.title || "Untitled Position"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
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
                                            ? "text-emerald-600"
                                            : (app.matchScore || 0) >= 60
                                              ? "text-amber-600"
                                              : "text-red-600",
                                        )}
                                      >
                                        {app.matchScore || 0}% match
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                              </div>
                            </motion.div>
                          );
                        },
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t bg-slate-50/50 dark:bg-slate-900/50">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Page {page} of {pagination.totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage(page - 1)}
                          className="h-8 sm:h-9 px-2 sm:px-3"
                        >
                          <ChevronLeft className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= pagination.totalPages}
                          onClick={() => setPage(page + 1)}
                          className="h-8 sm:h-9 px-2 sm:px-3"
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
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    violet:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
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
            <div className="flex items-center text-emerald-600 text-xs font-medium">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              Active
            </div>
          )}
        </div>
        <div className="mt-2 sm:mt-3">
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {label}
          </p>
          {subtext && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
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
          <Search className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
        ) : (
          <Briefcase className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
        )}
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
        {search ? "No matches found" : "No applications yet"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-2 px-4">
        {search
          ? "Try adjusting your search terms or filters to find what you're looking for."
          : "Start your job search and track your applications here."}
      </p>
      {!search && (
        <Button
          onClick={onBrowse}
          className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Browse Jobs
        </Button>
      )}
    </div>
  );
}
