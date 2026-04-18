"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Search,
  MoreHorizontal,
  Briefcase,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LayoutGrid,
  List,
  BarChart3,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobFormModal } from "@/components/jobs/job-form-modal";
import { DeleteJobDialog } from "@/components/jobs/delete-job-dialog";
import {
  useJobs,
  useCreateJob,
  useUpdateJob,
  useDeleteJob,
} from "@/hooks/use-jobs";
import type { CreateJobBody } from "@/lib/validations/job";
import { cn } from "@/lib/utils";
import { Job } from "@prisma/client";

// Extended type to include _count from API response
type JobWithCount = Job & {
  _count?: { cvJobAnalyses?: number };
};

// Enhanced status configuration for AI analysis
const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    icon: Clock,
    description: "Awaiting analysis",
  },
  processing: {
    label: "Processing",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: RefreshCw,
    description: "AI analyzing...",
  },
  completed: {
    label: "Analyzed",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: CheckCircle2,
    description: "Ready for review",
  },
  failed: {
    label: "Failed",
    color: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    icon: XCircle,
    description: "Retry needed",
  },
};

const jobStatusColors = {
  open: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed: "bg-amber-100 text-amber-800 border-amber-200",
  archived: "bg-slate-100 text-slate-800 border-slate-200",
};

export default function JobsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobStatusFilter, setJobStatusFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined);
  const [deletingJob, setDeletingJob] = useState<Job | undefined>(undefined);

  const { data, isLoading } = useJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const jobs = (data?.jobs as JobWithCount[]) || [];

  // Calculate metrics
  const totalJobs = jobs.length;
  const analyzedJobs = jobs.filter(
    (j) => j.analysisStatus === "completed",
  ).length;
  const pendingJobs = jobs.filter((j) => j.analysisStatus === "pending").length;
  const totalAnalyses = jobs.reduce(
    (acc, job) => acc + (job._count?.cvJobAnalyses ?? 0),
    0,
  );

  // Filter jobs by search, AI status, and job status
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.company?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || job.analysisStatus === statusFilter;
    const matchesJobStatus =
      jobStatusFilter === "all" || job.jobStatus === jobStatusFilter;
    return matchesSearch && matchesStatus && matchesJobStatus;
  });

  const handleCreate = async (data: CreateJobBody) => {
    await createJob.mutateAsync(data);
    setCreateModalOpen(false);
  };

  const handleUpdate = async (data: CreateJobBody) => {
    if (!editingJob) return;
    await updateJob.mutateAsync({ id: editingJob.id, data });
    setEditingJob(undefined);
  };

  const handleDelete = async () => {
    if (!deletingJob) return;
    await deleteJob.mutateAsync(deletingJob.id);
    setDeletingJob(undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Job Positions
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage opportunities and track candidate matches
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Position</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards (unchanged) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Total Positions
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Briefcase className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {totalJobs}
              </div>
              <p className="text-xs text-slate-500 mt-1">Active job postings</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Analyzed
              </CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {analyzedJobs}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress
                  value={totalJobs > 0 ? (analyzedJobs / totalJobs) * 100 : 0}
                  className="h-1.5 w-16"
                />
                <span className="text-xs text-slate-500">
                  {totalJobs > 0
                    ? Math.round((analyzedJobs / totalJobs) * 100)
                    : 0}
                  %
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                CV Analyses
              </CardTitle>
              <div className="p-2 rounded-lg bg-violet-500/10">
                <BarChart3 className="h-4 w-4 text-violet-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {totalAnalyses}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Total comparisons run
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-bl-full" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Pending
              </CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {pendingJobs}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Awaiting AI analysis
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">All Positions</CardTitle>
                <CardDescription>
                  {filteredJobs.length} position
                  {filteredJobs.length !== 1 ? "s" : ""} found
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search positions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as "list" | "grid")}
                >
                  <TabsList className="h-10">
                    <TabsTrigger value="list" className="gap-2">
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">List</span>
                    </TabsTrigger>
                    <TabsTrigger value="grid" className="gap-2">
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Filters: Analysis Status + Job Status */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="h-8"
              >
                All
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
                className="h-8"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Analyzed
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
                className="h-8"
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                Pending
              </Button>
              <Button
                variant={statusFilter === "processing" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("processing")}
                className="h-8"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Processing
              </Button>

              {/* Separator */}
              <div className="w-px h-6 bg-border mx-1" />

              {/* Job Status Filter */}
              <Select
                value={jobStatusFilter}
                onValueChange={setJobStatusFilter}
              >
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="Job status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All jobs</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : viewMode === "list" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[300px]">Position</TableHead>
                      <TableHead>Analysis Status</TableHead>
                      <TableHead>Job Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Analyses
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => {
                      const status =
                        statusConfig[
                          job.analysisStatus as keyof typeof statusConfig
                        ];
                      const StatusIcon = status?.icon || Clock;

                      return (
                        <TableRow
                          key={job.id}
                          onClick={() =>
                            router.push(`/my-account/jobs/${job.id}`)
                          }
                          className="cursor-pointer group"
                        >
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                  job.analysisStatus === "completed"
                                    ? "bg-emerald-500/10"
                                    : "bg-slate-100 dark:bg-slate-800",
                                )}
                              >
                                <Building2
                                  className={cn(
                                    "h-5 w-5",
                                    job.analysisStatus === "completed"
                                      ? "text-emerald-600"
                                      : "text-slate-500",
                                  )}
                                />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {job.title || "Untitled Position"}
                                </div>
                                <div className="text-sm text-slate-500">
                                  {job.company || "No company specified"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("gap-1.5", status?.color)}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {status?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={jobStatusColors[job.jobStatus]}>
                              {job.jobStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {job._count?.cvJobAnalyses ?? 0}
                              </span>
                              {(job._count?.cvJobAnalyses ?? 0) > 0 && (
                                <span className="text-xs text-slate-400">
                                  analyses
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-slate-500">
                            {formatDistanceToNow(new Date(job.createdAt), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setEditingJob(job)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(`/my-account/jobs/${job.id}`)
                                    }
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setEditingJob(job)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => setDeletingJob(job)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredJobs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-500">
                            <Search className="h-8 w-8 mb-2 opacity-50" />
                            <p>No positions found</p>
                            <p className="text-sm">
                              Try adjusting your search or filters
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
                  {filteredJobs.map((job) => {
                    const status =
                      statusConfig[
                        job.analysisStatus as keyof typeof statusConfig
                      ];
                    const StatusIcon = status?.icon || Clock;

                    return (
                      <Card
                        key={job.id}
                        className="group cursor-pointer border-0 shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800"
                        onClick={() =>
                          router.push(`/my-account/jobs/${job.id}`)
                        }
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                job.analysisStatus === "completed"
                                  ? "bg-emerald-500/10"
                                  : "bg-slate-100 dark:bg-slate-800",
                              )}
                            >
                              <Building2
                                className={cn(
                                  "h-6 w-6",
                                  job.analysisStatus === "completed"
                                    ? "text-emerald-600"
                                    : "text-slate-500",
                                )}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Badge
                                variant="outline"
                                className={cn("gap-1.5", status?.color)}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {status?.label}
                              </Badge>
                              <Badge className={jobStatusColors[job.jobStatus]}>
                                {job.jobStatus}
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-lg mt-3 line-clamp-1">
                            {job.title || "Untitled Position"}
                          </CardTitle>
                          <CardDescription className="line-clamp-1">
                            {job.company || "No company specified"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-500">
                              <BarChart3 className="h-4 w-4" />
                              <span>
                                {job._count?.cvJobAnalyses ?? 0} analyses
                              </span>
                            </div>
                            <span className="text-slate-400">
                              {formatDistanceToNow(new Date(job.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </CardContent>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/my-account/jobs/${job.id}`);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {filteredJobs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                    <Search className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No positions found</p>
                    <p className="text-sm">
                      Try adjusting your search or filters
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <JobFormModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreate}
        isSubmitting={createJob.isPending}
      />

      <JobFormModal
        open={!!editingJob}
        onOpenChange={() => setEditingJob(undefined)}
        initialData={editingJob}
        onSubmit={handleUpdate}
        isSubmitting={updateJob.isPending}
      />

      <DeleteJobDialog
        open={!!deletingJob}
        onOpenChange={() => setDeletingJob(undefined)}
        jobTitle={deletingJob?.title ?? undefined}
        onConfirm={handleDelete}
        isDeleting={deleteJob.isPending}
      />
    </div>
  );
}
