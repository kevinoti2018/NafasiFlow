"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  RefreshCw,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Users,
  Briefcase,
  Building2,
  Target,
  Sparkles,
  FileText,
  Zap,
  TrendingUp,
  Award,
  AlertCircle,
  MoreHorizontal,
  Download,
  Share2,
  ChevronRight,
  Lightbulb,
  Shield,
  BrainCircuit,
  PieChart,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobFormModal } from "@/components/jobs/job-form-modal";
import { DeleteJobDialog } from "@/components/jobs/delete-job-dialog";
import {
  useJob,
  useRetryJobAnalysis,
  useUpdateJob,
  useDeleteJob,
  useUpdateJobStatus,
} from "@/hooks/use-jobs";
import { useAnalysesByJob } from "@/hooks/use-analysis";
import { useCVs } from "@/hooks/use-cvs";
import {
  useAnalyzeCVWithJob,
  useReanalyzeJobCV,
  useDeleteJobAnalysis,
} from "@/hooks/use-job-analysis";
import type { CreateJobBody } from "@/lib/validations/job";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/app/types/analysis";
import { CVVersion } from "@prisma/client";
import { CreateApplicationModal } from "@/components/jobs/create-application-modal";

// Refined status configuration with consistent teal theme
const statusConfig = {
  pending: {
    label: "Analysis Pending",
    icon: Clock,
    color:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-500 dark:border-amber-500/30",
    pulse: true,
  },
  processing: {
    label: "AI Processing",
    icon: RefreshCw,
    color:
      "bg-[#005f78]/10 text-[#005f78] border-[#005f78]/20 dark:bg-[#005f78]/20 dark:text-[#4db8d4] dark:border-[#005f78]/30",
    pulse: true,
  },
  completed: {
    label: "Analysis Complete",
    icon: CheckCircle2,
    color:
      "bg-[#005f78]/10 text-[#005f78] border-[#005f78]/20 dark:bg-[#005f78]/20 dark:text-[#4db8d4] dark:border-[#005f78]/30",
    pulse: false,
  },
  failed: {
    label: "Analysis Failed",
    icon: XCircle,
    color:
      "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30",
    pulse: false,
  },
};

const verdictColors = {
  proceed: {
    bg: "bg-[#005f78]/10 dark:bg-[#005f78]/20",
    text: "text-[#005f78] dark:text-[#4db8d4]",
    border: "border-[#005f78]/30 dark:border-[#005f78]/40",
    icon: CheckCircle2,
    label: "Strong Match",
  },
  consider: {
    bg: "bg-amber-500/10 dark:bg-amber-500/15",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/30 dark:border-amber-500/40",
    icon: AlertCircle,
    label: "Consider",
  },
  high_risk: {
    bg: "bg-rose-500/10 dark:bg-rose-500/15",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-500/30 dark:border-rose-500/40",
    icon: XCircle,
    label: "High Risk",
  },
};

// Unified score color scale using primary teal
const getScoreColor = (score: number) => {
  if (score >= 80) return "text-[#005f78] dark:text-[#4db8d4]";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-[#005f78]";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
};

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState<string>("");
  const [selectedJobStatus, setSelectedJobStatus] = useState<string>("open");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);

  const { data, isLoading, error } = useJob(id as string);
  const { data: analyses, isLoading: analysesLoading } = useAnalysesByJob(
    id as string,
  );
  const { data: cvsData, isLoading: cvsLoading } = useCVs({ limit: 100 });
  const retryAnalysis = useRetryJobAnalysis();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();
  const analyzeMutation = useAnalyzeCVWithJob();
  const reanalyzeMutation = useReanalyzeJobCV();
  const deleteAnalysisMutation = useDeleteJobAnalysis();
  const updateJobStatus = useUpdateJobStatus();
  const job = data?.job;
  const cvs = cvsData?.cvVersions || [];

  useEffect(() => {
    if (job?.jobStatus) {
      setSelectedJobStatus(job.jobStatus);
    }
  }, [job?.jobStatus]);

  const structured = job?.structuredData;
  const isAnalyzed = job?.analysisStatus === "completed" && structured;
  const canManuallyAnalyze = ["pending", "processing", "failed"].includes(
    job?.analysisStatus,
  );

  const allowManualRetry = true;
  const handleRetry = () => {
    if (job?.id) retryAnalysis.mutate(job.id);
  };

  const handleEdit = async (data: CreateJobBody) => {
    if (!job) return;
    await updateJob.mutateAsync({ id: job.id, data });
    setEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (!job) return;
    await deleteJob.mutateAsync(job.id);
    router.push("/my-account/jobs");
  };

  const handleAnalyze = () => {
    if (selectedCvId && job?.id) {
      analyzeMutation.mutate({ jobId: job.id, cvId: selectedCvId });
      setSelectedCvId("");
    }
  };

  const handleReanalyze = (cvId: string) => {
    if (job?.id) reanalyzeMutation.mutate({ jobId: job.id, cvId });
  };

  const handleDeleteAnalysis = (analysisId: string) => {
    deleteAnalysisMutation.mutate(analysisId);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!job) return;
    setIsUpdatingStatus(true);
    try {
      await updateJobStatus.mutateAsync({ id: job.id, jobStatus: newStatus });
      setSelectedJobStatus(newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) return <JobDetailSkeleton />;
  if (error || !job) return <JobNotFound />;

  const StatusConfig =
    statusConfig[job.analysisStatus as keyof typeof statusConfig];
  const StatusIcon = StatusConfig?.icon || Clock;

  const matchScores =
    analyses?.analyses?.map((a: AnalysisResult) => a.matchScore) || [];
  const avgMatchScore =
    matchScores.length > 0
      ? Math.round(
          matchScores.reduce((a: number, b: number) => a + b, 0) /
            matchScores.length,
        )
      : 0;
  const topMatch = matchScores.length > 0 ? Math.max(...matchScores) : 0;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
        {/* Refined Header */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-[#161b1d]/80 border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">
              <div className="flex items-start gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/my-account/jobs")}
                  className="mt-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      {job.title || "Untitled Position"}
                    </h1>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-medium px-3 py-1",
                        StatusConfig?.color,
                      )}
                    >
                      <StatusIcon
                        className={cn(
                          "w-3.5 h-3.5 mr-1.5",
                          StatusConfig?.pulse && "animate-spin",
                        )}
                      />
                      {StatusConfig?.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {job.company || "Company not specified"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Posted{" "}
                      {formatDistanceToNow(new Date(job.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canManuallyAnalyze && allowManualRetry && (
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    disabled={retryAnalysis.isPending}
                    className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10 hover:text-[#005f78] dark:hover:text-[#4db8d4] hover:border-[#005f78]/30"
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4",
                        retryAnalysis.isPending && "animate-spin",
                      )}
                    />
                    {retryAnalysis.isPending
                      ? "Processing..."
                      : "Retry Analysis"}
                  </Button>
                )}

                <Select
                  value={selectedJobStatus}
                  onValueChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                >
                  <SelectTrigger className="w-[130px] h-9 bg-white dark:bg-[#161b1d] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-700">
                    <SelectItem
                      value="open"
                      className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                    >
                      Open
                    </SelectItem>
                    <SelectItem
                      value="closed"
                      className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                    >
                      Closed
                    </SelectItem>
                    <SelectItem
                      value="archived"
                      className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                    >
                      Archived
                    </SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-700"
                  >
                    <DropdownMenuItem
                      onClick={() => setEditModalOpen(true)}
                      className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Position
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setApplicationModalOpen(true)}
                  className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white"
                >
                  <Briefcase className="h-4 w-4" />
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Unified KPI Cards - Clean Card-Based Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Analysis Status
                </CardTitle>
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    StatusConfig?.color.split(" ")[0],
                  )}
                >
                  <StatusIcon
                    className={cn("h-4 w-4", StatusConfig?.color.split(" ")[1])}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isAnalyzed ? "Complete" : "Pending"}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {isAnalyzed
                    ? "AI insights available"
                    : "Analysis in progress"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  CV Matches
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/15">
                  <Briefcase className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {analyses?.analyses?.length || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {analyses?.analyses?.length > 0
                    ? `${avgMatchScore}% avg match`
                    : "No analyses yet"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Top Match Score
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/15">
                  <TrendingUp className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={cn("text-2xl font-bold", getScoreColor(topMatch))}
                >
                  {topMatch}%
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {topMatch > 0
                    ? "Best candidate alignment"
                    : "Analyze CVs to see scores"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Applications
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/15">
                  <Users className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {job._count?.applications || 0}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Total candidates tracked
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Refined Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-slate-100 dark:bg-[#161b1d] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <TabsTrigger
                value="overview"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#005f78] dark:data-[state=active]:bg-[#1c2225] dark:data-[state=active]:text-[#4db8d4]"
              >
                <FileText className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                disabled={!isAnalyzed}
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#005f78] dark:data-[state=active]:bg-[#1c2225] dark:data-[state=active]:text-[#4db8d4]"
              >
                <BrainCircuit className="w-4 h-4 mr-2" />
                AI Intelligence
                {isAnalyzed && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-[#005f78] dark:bg-[#4db8d4]" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="cvs"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#005f78] dark:data-[state=active]:bg-[#1c2225] dark:data-[state=active]:text-[#4db8d4]"
              >
                <Target className="w-4 h-4 mr-2" />
                CV Matches
                {analyses?.analyses?.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 text-xs bg-[#005f78]/10 text-[#005f78] dark:bg-[#005f78]/20 dark:text-[#4db8d4]"
                  >
                    {analyses.analyses.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab - Improved Layout */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-0 shadow-sm bg-white dark:bg-[#1c2225]">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                          <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                            Job Description
                          </CardTitle>
                          <CardDescription className="text-slate-500 dark:text-slate-400">
                            Original posting content
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={cn(
                        "prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed text-slate-600 dark:text-slate-300",
                        !descriptionExpanded && "line-clamp-6",
                      )}
                    >
                      {job.rawContent
                        .split("\n")
                        .map((line: string, i: number) => (
                          <p key={i} className="mb-2">
                            {line || "\u00A0"}
                          </p>
                        ))}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setDescriptionExpanded(!descriptionExpanded)
                      }
                      className="mt-4 gap-1 text-slate-600 hover:text-[#005f78] dark:text-slate-400 dark:hover:text-[#4db8d4]"
                    >
                      {descriptionExpanded ? (
                        <>
                          Show less <ChevronUp className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          Read full description{" "}
                          <ChevronDown className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card className="border-0 shadow-sm bg-[#005f78] text-white">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-white/80" />
                        Executive Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">Match Quality</span>
                          <span className="font-medium">
                            {topMatch > 0 ? `${topMatch}%` : "N/A"}
                          </span>
                        </div>
                        <Progress
                          value={topMatch}
                          className="h-2 bg-white/20 [&>div]:bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/70">CVs Analyzed</span>
                          <span className="font-medium">
                            {analyses?.analyses?.length || 0}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            (analyses?.analyses?.length || 0) * 10,
                            100,
                          )}
                          className="h-2 bg-white/20 [&>div]:bg-white"
                        />
                      </div>
                      <Separator className="bg-white/20" />
                      <div className="text-xs text-white/60">
                        Last updated:{" "}
                        {format(new Date(job.updatedAt), "MMM d, yyyy")}
                      </div>
                    </CardContent>
                  </Card>

                  {!isAnalyzed && (
                    <Card className="border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-amber-900 dark:text-amber-100">
                              Analysis Pending
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              AI analysis will unlock strategic insights about
                              this position.
                            </p>
                            {allowManualRetry && (
                              <Button
                                onClick={handleRetry}
                                className="mt-3 bg-amber-600 hover:bg-amber-700 text-white"
                                size="sm"
                              >
                                <Zap className="w-4 h-4 mr-2" />
                                Start Analysis
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* AI Analysis Tab - Cleaner Design */}
            <TabsContent value="analysis" className="space-y-6">
              {isAnalyzed ? (
                <>
                  <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-[#1c2225]">
                    <div className="bg-[#005f78] p-6 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-6 h-6 text-white/80" />
                        <h3 className="text-xl font-semibold">
                          Strategic Position Analysis
                        </h3>
                      </div>
                      <p className="text-white/80">
                        AI-generated insights for executive decision-making
                      </p>
                    </div>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            Primary Challenge
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {structured?.painPoints?.primaryChallenge ||
                              "Not specified"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#005f78] dark:text-[#4db8d4]" />
                            Ideal Candidate
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {structured?.idealCandidatePersona?.description ||
                              "Not specified"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[#005f78] dark:text-[#4db8d4]" />
                            Company DNA
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {structured?.companyDNA || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-0 shadow-sm bg-white dark:bg-[#1c2225]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                          <Shield className="w-5 h-5 text-[#005f78] dark:text-[#4db8d4]" />
                          Mandatory Requirements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Required Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {structured?.requirements?.mandatory?.skills?.map(
                              (skill: string) => (
                                <Badge
                                  key={skill}
                                  className="bg-[#005f78]/10 text-[#005f78] border-[#005f78]/20 dark:bg-[#005f78]/20 dark:text-[#4db8d4] dark:border-[#005f78]/30"
                                >
                                  {skill}
                                </Badge>
                              ),
                            ) || (
                              <span className="text-sm text-slate-500 dark:text-slate-500">
                                No skills specified
                              </span>
                            )}
                          </div>
                        </div>
                        {structured?.requirements?.mandatory?.experience && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Experience Required
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                              {structured.requirements.mandatory.experience}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white dark:bg-[#1c2225]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                          <Award className="w-5 h-5 text-amber-500" />
                          Preferred Qualifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Preferred Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {structured?.requirements?.preferred?.skills?.map(
                              (skill: string) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
                                >
                                  {skill}
                                </Badge>
                              ),
                            ) || (
                              <span className="text-sm text-slate-500 dark:text-slate-500">
                                No preferred skills specified
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-0 shadow-sm bg-white dark:bg-[#1c2225]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <Zap className="w-5 h-5 text-[#005f78] dark:text-[#4db8d4]" />
                        Strategic Keywords
                      </CardTitle>
                      <CardDescription className="text-slate-500 dark:text-slate-400">
                        ATS-critical and recruiter trigger terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#005f78] dark:bg-[#4db8d4]" />
                          ATS Critical Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {structured?.keywords?.atsCritical?.map(
                            (kw: string) => (
                              <Badge
                                key={kw}
                                className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                              >
                                {kw}
                              </Badge>
                            ),
                          ) || (
                            <span className="text-sm text-slate-500 dark:text-slate-500">
                              No keywords extracted
                            </span>
                          )}
                        </div>
                      </div>
                      <Separator className="bg-slate-100 dark:bg-slate-800" />
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Recruiter Triggers
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {structured?.keywords?.recruiterTriggers?.map(
                            (kw: string) => (
                              <Badge
                                key={kw}
                                variant="outline"
                                className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400"
                              >
                                {kw}
                              </Badge>
                            ),
                          ) || (
                            <span className="text-sm text-slate-500 dark:text-slate-500">
                              No triggers identified
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-0 shadow-sm bg-white dark:bg-[#1c2225]">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <BrainCircuit className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Analysis Not Available
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                      AI analysis is currently {job.analysisStatus}. Complete
                      the analysis to unlock strategic insights about this
                      position.
                    </p>
                    {canManuallyAnalyze && allowManualRetry && (
                      <Button
                        onClick={handleRetry}
                        size="lg"
                        className="bg-[#005f78] hover:bg-[#004a5e] text-white"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run Analysis Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* CV Matches Tab - Refined */}
            <TabsContent value="cvs" className="space-y-6">
              <Card className="border-0 shadow-sm bg-white dark:bg-[#1c2225]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <PieChart className="w-5 h-5 text-[#005f78] dark:text-[#4db8d4]" />
                    Match Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">
                    Compare your CV against this position to see alignment
                    scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Select
                        value={selectedCvId}
                        onValueChange={setSelectedCvId}
                      >
                        <SelectTrigger className="h-11 bg-white dark:bg-[#161b1d] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                          <SelectValue placeholder="Select a CV to analyze..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-700">
                          {cvsLoading ? (
                            <SelectItem value="loading" disabled>
                              Loading CVs...
                            </SelectItem>
                          ) : cvs.length === 0 ? (
                            <SelectItem value="none" disabled>
                              No CVs found. Upload one first.
                            </SelectItem>
                          ) : (
                            cvs.map((cv: CVVersion) => (
                              <SelectItem
                                key={cv.id}
                                value={cv.id}
                                className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                              >
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  {cv.name ||
                                    `CV from ${formatDistanceToNow(new Date(cv.createdAt))}`}
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={!selectedCvId || analyzeMutation.isPending}
                      size="lg"
                      className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white"
                    >
                      {analyzeMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Run Match Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm bg-white dark:bg-[#1c2225]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-900 dark:text-slate-100">
                      Analysis Results
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      {analyses?.analyses?.length || 0} CV
                      {analyses?.analyses?.length !== 1 ? "s" : ""} analyzed
                    </CardDescription>
                  </div>
                  {analyses?.analyses?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span>Avg Score:</span>
                      <span
                        className={cn(
                          "font-bold",
                          getScoreColor(avgMatchScore),
                        )}
                      >
                        {avgMatchScore}%
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {analysesLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-20 w-full bg-slate-200 dark:bg-slate-800"
                        />
                      ))}
                    </div>
                  ) : analyses?.analyses?.length ? (
                    <div className="space-y-3">
                      {analyses.analyses.map(
                        (analysis: AnalysisResult, index: number) => {
                          const verdict =
                            verdictColors[
                              analysis.verdict as keyof typeof verdictColors
                            ];
                          const VerdictIcon = verdict?.icon || AlertCircle;
                          return (
                            <div
                              key={analysis.id}
                              className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#005f78]/30 dark:hover:border-[#005f78]/30 hover:shadow-sm transition-all bg-white dark:bg-[#161b1d]"
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white",
                                    getScoreBg(analysis.matchScore),
                                  )}
                                >
                                  {analysis.matchScore}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                      CV #{index + 1}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-500">
                                      {formatDistanceToNow(
                                        new Date(analysis.cvVersion.createdAt),
                                        { addSuffix: true },
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                      className={cn(
                                        verdict?.bg,
                                        verdict?.text,
                                        verdict?.border,
                                        "border",
                                      )}
                                    >
                                      <VerdictIcon className="w-3 h-3 mr-1" />
                                      {verdict?.label || analysis.verdict}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    router.push(
                                      `/my-account/cv/${analysis.cvVersionId}`,
                                    )
                                  }
                                  className="text-slate-600 dark:text-slate-400 hover:text-[#005f78] dark:hover:text-[#4db8d4] hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10"
                                >
                                  View CV
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleReanalyze(analysis.cvVersionId)
                                  }
                                  disabled={reanalyzeMutation.isPending}
                                  className="text-slate-600 dark:text-slate-400 hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                                >
                                  <RefreshCw
                                    className={cn(
                                      "h-4 w-4 mr-1",
                                      reanalyzeMutation.isPending &&
                                        "animate-spin",
                                    )}
                                  />
                                  Re-run
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteAnalysis(analysis.id)
                                  }
                                  disabled={deleteAnalysisMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Target className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        No Analyses Yet
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        Select a CV above to see how well it matches this job
                        description
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals */}
        <JobFormModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          initialData={job}
          onSubmit={handleEdit}
          isSubmitting={updateJob.isPending}
        />
        <CreateApplicationModal
          open={applicationModalOpen}
          onOpenChange={setApplicationModalOpen}
          jobId={job.id}
          jobTitle={job.title}
          onSuccess={() => {
            // Optionally refetch data or show toast
            setApplicationModalOpen(false);
          }}
        />
        <DeleteJobDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          jobTitle={job.title}
          onConfirm={handleDelete}
          isDeleting={deleteJob.isPending}
        />
      </div>
    </TooltipProvider>
  );
}

// Enhanced Skeleton Loading
function JobDetailSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#161b1d]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-4 w-40 bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
        <Skeleton className="h-12 w-80 rounded-lg mb-6 bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-96 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function JobNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d] flex items-center justify-center">
      <Card className="border-0 shadow-lg max-w-md mx-auto text-center p-8 bg-white dark:bg-[#1c2225]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Position Not Found
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          The job you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button
          onClick={() => (window.location.href = "/my-account/jobs")}
          size="lg"
          className="bg-[#005f78] hover:bg-[#004a5e] text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </Card>
    </div>
  );
}
