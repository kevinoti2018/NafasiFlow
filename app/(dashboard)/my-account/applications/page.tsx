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
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  FileText,
  ExternalLink,
  LayoutGrid,
  List,
  MapPin,
  ArrowUpRight,
  RotateCcw,
  Eye,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApplications } from "@/hooks/use-application";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#161b1d]/80 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#005f78] shadow-lg shadow-[#005f78]/25">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Applications
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Track and manage your job applications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white"
                onClick={() => router.push("/my-account/jobs")}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Find Jobs</span>
                <span className="sm:hidden">Find</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        {!isLoading && applications.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Applications
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/15">
                  <Briefcase className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {totalApps}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  All applications
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Interviewing
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/15">
                  <Sparkles className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {interviewingCount}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={
                      totalApps > 0 ? (interviewingCount / totalApps) * 100 : 0
                    }
                    className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {totalApps > 0
                      ? Math.round((interviewingCount / totalApps) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-bl-full dark:bg-emerald-500/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Offers
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {offeredCount}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Job offers received
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Avg Match Score
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/15">
                  <Target className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {avgMatchScore}%
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Across all applications
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                  Your Applications
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  {isLoading
                    ? "Loading applications..."
                    : `${filteredApps.length} application${filteredApps.length !== 1 ? "s" : ""} found`}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search jobs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 bg-white dark:bg-[#161b1d] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as "list" | "grid")}
                >
                  <TabsList className="h-10 bg-slate-100 dark:bg-[#161b1d]">
                    <TabsTrigger
                      value="list"
                      className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#005f78] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#005f78] dark:data-[state=active]:text-white"
                    >
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">List</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="grid"
                      className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#005f78] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#005f78] dark:data-[state=active]:text-white"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button
                variant={status === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("all")}
                className={cn(
                  "h-8",
                  status === "all"
                    ? "bg-[#005f78] hover:bg-[#004a5e] text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#005f78] hover:border-[#005f78]/50 dark:hover:text-slate-200",
                )}
              >
                All
              </Button>
              <Button
                variant={status === "saved" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("saved")}
                className={cn(
                  "h-8",
                  status === "saved"
                    ? "bg-slate-700 hover:bg-slate-800 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-700 hover:border-slate-500/50",
                )}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Saved
              </Button>
              <Button
                variant={status === "applied" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("applied")}
                className={cn(
                  "h-8",
                  status === "applied"
                    ? "bg-[#005f78] hover:bg-[#004a5e] text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#005f78] hover:border-[#005f78]/50 dark:hover:text-slate-200",
                )}
              >
                <Briefcase className="h-3.5 w-3.5 mr-1.5" />
                Applied
              </Button>
              <Button
                variant={status === "interviewing" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("interviewing")}
                className={cn(
                  "h-8",
                  status === "interviewing"
                    ? "bg-[#005f78] hover:bg-[#004a5e] text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#005f78] hover:border-[#005f78]/50 dark:hover:text-slate-200",
                )}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Interviewing
              </Button>
              <Button
                variant={status === "offered" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("offered")}
                className={cn(
                  "h-8",
                  status === "offered"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:border-emerald-500/50",
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Offered
              </Button>
              <Button
                variant={status === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatus("rejected")}
                className={cn(
                  "h-8",
                  status === "rejected"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:border-red-500/50",
                )}
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Rejected
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-16 w-full bg-slate-200 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : viewMode === "list" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="w-[35%] text-slate-500 dark:text-slate-400">
                        Position
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        Match Score
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        Status
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
                        Applied
                      </TableHead>
                      <TableHead className="text-right text-slate-500 dark:text-slate-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApps.map((app: ApplicationWithJob) => {
                      const statusConfigItem = statusConfig[app.status];
                      const StatusIcon = statusConfigItem.icon;

                      return (
                        <TableRow
                          key={app.id}
                          onClick={() =>
                            router.push(`/my-account/applications/${app.id}`)
                          }
                          className="cursor-pointer group border-slate-100 dark:border-slate-800 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/5"
                        >
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                  app.status === "offered"
                                    ? "bg-emerald-100 dark:bg-emerald-900/30"
                                    : "bg-slate-100 dark:bg-slate-800",
                                )}
                              >
                                <Building2
                                  className={cn(
                                    "h-5 w-5",
                                    app.status === "offered"
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-slate-400 dark:text-slate-500",
                                  )}
                                />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {app.job?.title || "Untitled Position"}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-500">
                                  {app.job?.company || "Unknown Company"}
                                </div>
                                {app.job?.location && (
                                  <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {app.job.location}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center border-2",
                                  (app.matchScore || 0) >= 80
                                    ? "bg-[#005f78]/10 border-[#005f78]/20 dark:bg-[#005f78]/20 dark:border-[#005f78]/30"
                                    : (app.matchScore || 0) >= 60
                                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"
                                      : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
                                )}
                              >
                                <span
                                  className={cn(
                                    "text-xs font-bold",
                                    (app.matchScore || 0) >= 80
                                      ? "text-[#005f78] dark:text-[#4db8d4]"
                                      : (app.matchScore || 0) >= 60
                                        ? "text-amber-700 dark:text-amber-400"
                                        : "text-red-700 dark:text-red-400",
                                  )}
                                >
                                  {app.matchScore || 0}
                                </span>
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
                              variant="outline"
                              className={cn("gap-1.5", statusConfigItem.color)}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfigItem.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-500">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {app.appliedAt
                                ? format(new Date(app.appliedAt), "MMM d, yyyy")
                                : "Not applied"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#005f78] hover:text-[#005f78] hover:bg-[#005f78]/10 dark:hover:text-[#4db8d4] dark:hover:bg-[#005f78]/10"
                                onClick={() =>
                                  router.push(
                                    `/my-account/applications/${app.id}`,
                                  )
                                }
                              >
                                <span className="hidden sm:inline mr-1 text-xs">
                                  View
                                </span>
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-700"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(
                                        `/my-account/applications/${app.id}`,
                                      )
                                    }
                                    className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {app.job?.url && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        window.open(app.job!.url!, "_blank")
                                      }
                                      className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                                    >
                                      <ExternalLink className="mr-2 h-4 w-4" />
                                      Open Job Posting
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredApps.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-500">
                            <Search className="h-8 w-8 mb-2 opacity-50" />
                            <p>No applications found</p>
                            <p className="text-sm">
                              {search || status !== "all"
                                ? "Try adjusting your search or filters"
                                : "Start applying to jobs to track them here"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredApps.map((app: ApplicationWithJob) => {
                    const statusConfigItem = statusConfig[app.status];
                    const StatusIcon = statusConfigItem.icon;

                    return (
                      <Card
                        key={app.id}
                        className="group cursor-pointer border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-[#161b1d] hover:border-[#005f78]/30 dark:hover:border-[#005f78]/30"
                        onClick={() =>
                          router.push(`/my-account/applications/${app.id}`)
                        }
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                app.status === "offered"
                                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                                  : "bg-slate-100 dark:bg-slate-800",
                              )}
                            >
                              <Building2
                                className={cn(
                                  "h-6 w-6",
                                  app.status === "offered"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-slate-400 dark:text-slate-500",
                                )}
                              />
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("gap-1.5", statusConfigItem.color)}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfigItem.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg mt-3 line-clamp-1 text-slate-900 dark:text-slate-100">
                            {app.job?.title || "Untitled Position"}
                          </CardTitle>
                          <CardDescription className="line-clamp-1 text-slate-500 dark:text-slate-500">
                            {app.job?.company || "Unknown Company"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center border-2",
                                  (app.matchScore || 0) >= 80
                                    ? "bg-[#005f78]/10 border-[#005f78]/20 dark:bg-[#005f78]/20 dark:border-[#005f78]/30"
                                    : (app.matchScore || 0) >= 60
                                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"
                                      : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
                                )}
                              >
                                <span
                                  className={cn(
                                    "text-xs font-bold",
                                    (app.matchScore || 0) >= 80
                                      ? "text-[#005f78] dark:text-[#4db8d4]"
                                      : (app.matchScore || 0) >= 60
                                        ? "text-amber-700 dark:text-amber-400"
                                        : "text-red-700 dark:text-red-400",
                                  )}
                                >
                                  {app.matchScore || 0}
                                </span>
                              </div>
                              <div className="w-20">
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
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {app.appliedAt
                                ? format(new Date(app.appliedAt), "MMM d")
                                : "Not applied"}
                            </span>
                          </div>
                        </CardContent>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 shadow-lg bg-[#005f78] hover:bg-[#004a5e] text-white border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/my-account/applications/${app.id}`);
                            }}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {filteredApps.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-500">
                    <Search className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No applications found</p>
                    <p className="text-sm">
                      {search || status !== "all"
                        ? "Try adjusting your search or filters"
                        : "Start applying to jobs to track them here"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Page {page} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="h-9 px-3 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="h-9 px-3 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
