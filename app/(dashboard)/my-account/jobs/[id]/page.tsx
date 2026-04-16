// app/(dashboard)/jobs/[id]/page.tsx
"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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
  Share2,
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
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { CVVersion } from "@/lib/generated/prisma";

// Enhanced status configuration with executive styling
const statusConfig = {
  pending: {
    label: "Analysis Pending",
    icon: Clock,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    gradient: "from-amber-500/20 to-orange-500/20",
    pulse: true,
  },
  processing: {
    label: "AI Processing",
    icon: RefreshCw,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    gradient: "from-blue-500/20 to-cyan-500/20",
    pulse: true,
  },
  completed: {
    label: "Analysis Complete",
    icon: CheckCircle2,
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    gradient: "from-emerald-500/20 to-teal-500/20",
    pulse: false,
  },
  failed: {
    label: "Analysis Failed",
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    gradient: "from-red-500/20 to-rose-500/20",
    pulse: false,
  },
};

const verdictColors = {
  proceed: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
    label: "Strong Match",
  },
  consider: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    border: "border-amber-500/30",
    icon: AlertCircle,
    label: "Consider",
  },
  high_risk: {
    bg: "bg-rose-500/10",
    text: "text-rose-700",
    border: "border-rose-500/30",
    icon: XCircle,
    label: "High Risk",
  },
};

// Executive score color scale
const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-emerald-500";
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

  const job = data?.job;
  const cvs = cvsData?.cvVersions || [];

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
    router.push("/jobs");
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

  if (isLoading) return <JobDetailSkeleton />;
  if (error || !job) return <JobNotFound />;

  const StatusConfig =
    statusConfig[job.analysisStatus as keyof typeof statusConfig];
  const StatusIcon = StatusConfig?.icon || Clock;

  // Calculate match statistics
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Executive Header with Glass Effect */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">
              {/* Left: Navigation & Title */}
              <div className="flex items-start gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/my-account/jobs")}
                  className="mt-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
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

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {canManuallyAnalyze && allowManualRetry && (
                  <Button
                    variant="outline"
                    onClick={handleRetry}
                    disabled={retryAnalysis.isPending}
                    className="gap-2"
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Position
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setDeleteDialogOpen(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Executive KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full" />
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
                  <StatusIcon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {isAnalyzed ? "Complete" : "Pending"}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isAnalyzed
                    ? "AI insights available"
                    : "Analysis in progress"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-full" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  CV Matches
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {analyses?.analyses?.length || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {analyses?.analyses?.length > 0
                    ? `${avgMatchScore}% avg match`
                    : "No analyses yet"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-bl-full" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Top Match Score
                </CardTitle>
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className={cn("text-2xl font-bold", getScoreColor(topMatch))}
                >
                  {topMatch}%
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {topMatch > 0
                    ? "Best candidate alignment"
                    : "Analyze CVs to see scores"}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-bl-full" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Applications
                </CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {job._count?.applications || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Total candidates tracked
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl">
              <TabsTrigger
                value="overview"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
              >
                <FileText className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                disabled={!isAnalyzed}
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
              >
                <BrainCircuit className="w-4 h-4 mr-2" />
                AI Intelligence
                {isAnalyzed && (
                  <span className="ml-2 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="cvs"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
              >
                <Target className="w-4 h-4 mr-2" />
                CV Matches
                {analyses?.analyses?.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {analyses.analyses.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Description Card */}
                <Card className="lg:col-span-2 border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                          <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Job Description
                          </CardTitle>
                          <CardDescription>
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
                      className="mt-4 gap-1 text-slate-600 hover:text-slate-900"
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

                {/* Quick Stats Sidebar */}
                <div className="space-y-4">
                  <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        Executive Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Match Quality</span>
                          <span className="font-medium">
                            {topMatch > 0 ? `${topMatch}%` : "N/A"}
                          </span>
                        </div>
                        <Progress
                          value={topMatch}
                          className="h-2 bg-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">CVs Analyzed</span>
                          <span className="font-medium">
                            {analyses?.analyses?.length || 0}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(
                            (analyses?.analyses?.length || 0) * 10,
                            100,
                          )}
                          className="h-2 bg-slate-700"
                        />
                      </div>
                      <Separator className="bg-slate-700" />
                      <div className="text-xs text-slate-400">
                        Last updated:{" "}
                        {format(new Date(job.updatedAt), "MMM d, yyyy")}
                      </div>
                    </CardContent>
                  </Card>

                  {!isAnalyzed && (
                    <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
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
                                className="mt-3 bg-amber-600 hover:bg-amber-700"
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

            {/* AI Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              {isAnalyzed ? (
                <>
                  {/* Strategic Overview */}
                  <Card className="border-0 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="w-6 h-6 text-emerald-400" />
                        <h3 className="text-xl font-semibold">
                          Strategic Position Analysis
                        </h3>
                      </div>
                      <p className="text-slate-300">
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
                            {structured.painPoints?.primaryChallenge ||
                              "Not specified"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            Ideal Candidate
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {structured.idealCandidatePersona?.description ||
                              "Not specified"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-violet-500" />
                            Company DNA
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {structured.companyDNA || "Unknown"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Requirements Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-emerald-600" />
                          Mandatory Requirements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Required Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {structured.requirements?.mandatory?.skills?.map(
                              (skill: string) => (
                                <Badge
                                  key={skill}
                                  className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                                >
                                  {skill}
                                </Badge>
                              ),
                            ) || (
                              <span className="text-sm text-slate-500">
                                No skills specified
                              </span>
                            )}
                          </div>
                        </div>
                        {structured.requirements?.mandatory?.experience && (
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

                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-600" />
                          Preferred Qualifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                            Preferred Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {structured.requirements?.preferred?.skills?.map(
                              (skill: string) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="text-slate-600 dark:text-slate-400"
                                >
                                  {skill}
                                </Badge>
                              ),
                            ) || (
                              <span className="text-sm text-slate-500">
                                No preferred skills specified
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Keywords Section */}
                  <Card className="border-0 shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-violet-600" />
                        Strategic Keywords
                      </CardTitle>
                      <CardDescription>
                        ATS-critical and recruiter trigger terms
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          ATS Critical Keywords
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {structured.keywords?.atsCritical?.map(
                            (kw: string) => (
                              <Badge
                                key={kw}
                                className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {kw}
                              </Badge>
                            ),
                          ) || (
                            <span className="text-sm text-slate-500">
                              No keywords extracted
                            </span>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Recruiter Triggers
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {structured.keywords?.recruiterTriggers?.map(
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
                            <span className="text-sm text-slate-500">
                              No triggers identified
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <BrainCircuit className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      Analysis Not Available
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                      AI analysis is currently {job.analysisStatus}. Complete
                      the analysis to unlock strategic insights about this
                      position.
                    </p>
                    {canManuallyAnalyze && allowManualRetry && (
                      <Button onClick={handleRetry} size="lg">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run Analysis Now
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* CV Matches Tab */}
            <TabsContent value="cvs" className="space-y-6">
              {/* Analysis Input */}
              <Card className="border-0 shadow-sm bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-600" />
                    Match Analysis
                  </CardTitle>
                  <CardDescription>
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
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select a CV to analyze..." />
                        </SelectTrigger>
                        <SelectContent>
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
                              <SelectItem key={cv.id} value={cv.id}>
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  {/*{cv.name ||*/}
                                  {`CV from ${formatDistanceToNow(new Date(cv.createdAt))}`}
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
                      className="gap-2"
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

              {/* Results List */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>
                      {analyses?.analyses?.length || 0} CV
                      {analyses?.analyses?.length !== 1 ? "s" : ""} analyzed
                    </CardDescription>
                  </div>
                  {analyses?.analyses?.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
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
                        <Skeleton key={i} className="h-20 w-full" />
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
                              className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  className={cn(
                                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold",
                                    getScoreBg(analysis.matchScore),
                                    "text-white",
                                  )}
                                >
                                  {analysis.matchScore}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                      CV #{index + 1}
                                    </span>
                                    <span className="text-xs text-slate-500">
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
                                  className="text-slate-600"
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
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                        <Target className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                        No Analyses Yet
                      </h3>
                      <p className="text-slate-500 max-w-sm mx-auto">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-80 rounded-lg mb-6" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}

function JobNotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
      <Card className="border-0 shadow-lg max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Position Not Found
        </h2>
        <p className="text-slate-500 mb-6">
          The job you`&apos;`re looking for doesn`&apos;`t exist or you
          don`&apos;`t have access to it.
        </p>
        <Button onClick={() => (window.location.href = "/jobs")} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </Card>
    </div>
  );
}
