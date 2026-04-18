// app/(dashboard)/cv/[id]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  FileText,
  Layout,
  TrendingUp,
  Briefcase,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Target,
  Clock,
  Download,
  RefreshCw,
  GitBranch,
  ChevronRight,
  Zap,
  Shield,
  Award,
  MoreHorizontal,
  FileSearch,
  Edit3,
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteCVDialog } from "@/components/cv/delete-cv-dialog";
import { CVPreviewModal } from "@/components/cv/cv-preview-modal";
import { useCV, useDeleteCV, useReanalyzeCV } from "@/hooks/use-cvs";
import { useAnalysesByCV } from "@/hooks/use-analysis";
import { cn } from "@/lib/utils";
import { CVVersion } from "@prisma/client";
import { GeneratePdfModal } from "@/components/cv/generate-pdf-modal";
// Type for analysis results
type AnalysisResult = {
  id: string;
  matchScore: number;
  verdict: string;
  jobId: string;
  job: {
    title: string | null;
    company: string | null;
  };
  cvVersion: {
    createdAt: string;
  };
};

// Type for format issues
type FormatIssue = {
  type: string;
  severity: "high" | "medium" | "low";
  message: string;
};

const verdictConfig = {
  proceed: {
    label: "Strong Match",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
    description: "High compatibility with job requirements",
  },
  consider: {
    label: "Moderate Fit",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Target,
    description: "Some alignment, may need tailoring",
  },
  high_risk: {
    label: "Low Compatibility",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
    description: "Significant gaps in qualifications",
  },
};

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300",
        onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
        "group",
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110",
          trend === "up"
            ? "bg-emerald-500"
            : trend === "down"
              ? "bg-red-500"
              : "bg-blue-500",
        )}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div
          className={cn(
            "p-2 rounded-lg transition-colors",
            trend === "up"
              ? "bg-emerald-100 text-emerald-600"
              : trend === "down"
                ? "bg-red-100 text-red-600"
                : "bg-blue-100 text-blue-600",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight">
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function ScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
        ? "text-amber-500"
        : "text-red-500";
  const bgColor =
    score >= 80
      ? "text-emerald-100"
      : score >= 60
        ? "text-amber-100"
        : "text-red-100";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className={cn("transition-all duration-1000", bgColor)}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn("transition-all duration-1000", color)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className={cn("text-2xl font-bold", color.replace("text-", "text-"))}
        >
          {score}%
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">
          Score
        </span>
      </div>
    </div>
  );
}

export default function CVDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const { data, isLoading, error } = useCV(id as string);
  const { data: analyses, isLoading: analysesLoading } = useAnalysesByCV(
    id as string,
  );
  const deleteCV = useDeleteCV();
  const reanalyzeMutation = useReanalyzeCV();

  const cv = data?.cvVersion as CVVersion & {
    parent?: CVVersion | null;
    children?: CVVersion[];
  };

  const handleDelete = async () => {
    if (!cv) return;
    await deleteCV.mutateAsync(cv.id);
    router.push("/my-account/cv");
  };

  const handleReanalyze = () => {
    if (cv) reanalyzeMutation.mutate(cv.id);
  };

  if (isLoading) return <CVDetailSkeleton />;
  if (error || !cv) return <CVNotFound />;

  const displayName =
    cv.name || `CV from ${formatDistanceToNow(new Date(cv.createdAt))}`;
  const formatIssues = (cv.formatIssues as FormatIssue[]) || [];
  const hasIssues = formatIssues.length > 0;

  const formatScore = cv.atsFormatScore || 0;
  const contentScore = cv.atsContentScore || 0;
  const overallScore = Math.round((formatScore + contentScore) / 2);

  const isOptimized = overallScore >= 80;
  const needsWork = overallScore < 60;

  // Safely get analyses array
  const analysisList = (analyses?.analyses as AnalysisResult[]) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl space-y-6 sm:space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/my-account/cv")}
            className="gap-2 h-auto py-1 px-2 -ml-2 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Documents
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-md">
            {displayName}
          </span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                {displayName}
              </h1>
              <Badge
                variant={
                  isOptimized
                    ? "default"
                    : needsWork
                      ? "destructive"
                      : "secondary"
                }
                className="mt-1"
              >
                {isOptimized
                  ? "ATS Optimized"
                  : needsWork
                    ? "Needs Improvement"
                    : "Good"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Uploaded{" "}
                {formatDistanceToNow(new Date(cv.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {cv.originalFileUrl && (
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  Cloud Stored
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {cv.originalFileUrl && (
                  <DropdownMenuItem asChild>
                    <a
                      href={cv.originalFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Original
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setGenerateModalOpen(true)}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Generate PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleReanalyze}
                  disabled={reanalyzeMutation.isPending}
                  className="gap-2"
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      reanalyzeMutation.isPending && "animate-spin",
                    )}
                  />
                  Re-analyze
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/my-account/cv/${cv.id}/optimize`)
                  }
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Optimize with AI
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => router.push(`/my-account/cv/${cv.id}/optimize`)}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Optimize</span>
            </Button>
          </div>
        </div>

        {/* Score Overview Card */}
        <Card
          className={cn(
            "overflow-hidden border-0 shadow-lg",
            isOptimized
              ? "bg-gradient-to-br from-emerald-50 to-teal-50"
              : needsWork
                ? "bg-gradient-to-br from-red-50 to-orange-50"
                : "bg-gradient-to-br from-amber-50 to-yellow-50",
          )}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              <div className="flex-shrink-0">
                <ScoreRing score={overallScore} size={140} />
              </div>
              <div className="flex-1 w-full space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {isOptimized
                      ? "Excellent ATS Compatibility"
                      : needsWork
                        ? "Requires Significant Improvement"
                        : "Good Foundation with Room to Grow"}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isOptimized
                      ? "Your CV is highly optimized and ready for executive applications. Both format and content meet industry standards."
                      : needsWork
                        ? "Multiple issues detected that may prevent your CV from passing automated screening systems. Review recommendations below."
                        : "Solid foundation with specific areas for enhancement. Addressing these will significantly improve your match rates."}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        Format & Structure
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          formatScore >= 80
                            ? "text-emerald-600"
                            : formatScore >= 60
                              ? "text-amber-600"
                              : "text-red-600",
                        )}
                      >
                        {formatScore}%
                      </span>
                    </div>
                    <Progress value={formatScore} className="h-2.5" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Content & Keywords
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          contentScore >= 80
                            ? "text-emerald-600"
                            : contentScore >= 60
                              ? "text-amber-600"
                              : "text-red-600",
                        )}
                      >
                        {contentScore}%
                      </span>
                    </div>
                    <Progress value={contentScore} className="h-2.5" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Format Score"
            value={cv.atsFormatScore !== null ? `${cv.atsFormatScore}%` : "—"}
            description="ATS parsing compatibility"
            icon={Layout}
            trend={
              formatScore >= 80 ? "up" : formatScore >= 60 ? "neutral" : "down"
            }
          />
          <StatCard
            title="Content Score"
            value={cv.atsContentScore !== null ? `${cv.atsContentScore}%` : "—"}
            description="Keyword & impact analysis"
            icon={TrendingUp}
            trend={
              contentScore >= 80
                ? "up"
                : contentScore >= 60
                  ? "neutral"
                  : "down"
            }
          />
          <StatCard
            title="Parsing Confidence"
            value={
              cv.parsingConfidence !== null ? `${cv.parsingConfidence}%` : "—"
            }
            description="Data extraction accuracy"
            icon={FileSearch}
          />
          <StatCard
            title="Job Matches"
            value={String(analysisList.length)}
            description="Positions analyzed"
            icon={Briefcase}
            onClick={() => setActiveTab("jobs")}
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <div className="overflow-x-auto -mx-3 px-3 pb-2">
            <TabsList className="inline-flex w-auto min-w-full sm:w-full bg-muted/50 p-1">
              <TabsTrigger
                value="overview"
                className="gap-2 text-xs sm:text-sm"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="format"
                className="gap-2 text-xs sm:text-sm relative"
              >
                <Layout className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Format
                {hasIssues && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background" />
                )}
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2 text-xs sm:text-sm">
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Matches
                {analysisList.length > 0 && (
                  <span className="ml-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    {analysisList.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="gap-2 text-xs sm:text-sm"
              >
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Recommendations</span>
                <span className="sm:hidden">Tips</span>
              </TabsTrigger>
              <TabsTrigger
                value="versions"
                className="gap-2 text-xs sm:text-sm"
              >
                <GitBranch className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Versions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 mt-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Extracted Profile
                    </CardTitle>
                    <CardDescription>
                      AI-structured data from your CV
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 rounded-lg p-4 overflow-auto max-h-[500px]">
                  <pre className="text-xs sm:text-sm font-mono text-slate-50 leading-relaxed">
                    {JSON.stringify(cv.profile, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="format" className="space-y-4 mt-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layout className="h-5 w-5" />
                      Format Analysis
                    </CardTitle>
                    <CardDescription>
                      ATS compatibility and structure review
                    </CardDescription>
                  </div>
                  {hasIssues ? (
                    <Badge variant="destructive" className="w-fit gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {formatIssues.length} issue
                      {formatIssues.length !== 1 ? "s" : ""} found
                    </Badge>
                  ) : (
                    <Badge className="w-fit gap-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      No issues detected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {hasIssues ? (
                  <div className="space-y-3">
                    {formatIssues.map((issue: FormatIssue, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-start gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md",
                          issue.severity === "high"
                            ? "bg-red-50/80 border-red-200"
                            : issue.severity === "medium"
                              ? "bg-amber-50/80 border-amber-200"
                              : "bg-blue-50/80 border-blue-200",
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                            issue.severity === "high"
                              ? "bg-red-100 text-red-600"
                              : issue.severity === "medium"
                                ? "bg-amber-100 text-amber-600"
                                : "bg-blue-100 text-blue-600",
                          )}
                        >
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">
                              {issue.type}
                            </h4>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase tracking-wide",
                                issue.severity === "high"
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : issue.severity === "medium"
                                    ? "border-amber-300 text-amber-700 bg-amber-50"
                                    : "border-blue-300 text-blue-700 bg-blue-50",
                              )}
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {issue.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Perfect Format</h3>
                      <p className="text-muted-foreground max-w-md mx-auto mt-1">
                        Your CV format is fully optimized for ATS parsing.
                        Structure, fonts, and layout are all compatible.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jobs" className="space-y-4 mt-2">
            {analysesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full" />
                ))}
              </div>
            ) : analysisList.length ? (
              <div className="grid gap-3">
                {analysisList.map((analysis: AnalysisResult) => {
                  const verdict =
                    verdictConfig[
                      analysis.verdict as keyof typeof verdictConfig
                    ] || verdictConfig.consider;
                  const VerdictIcon = verdict.icon;

                  return (
                    <Card
                      key={analysis.id}
                      className="group cursor-pointer hover:shadow-lg transition-all border-l-4"
                      style={{
                        borderLeftColor:
                          analysis.verdict === "proceed"
                            ? "#10b981"
                            : analysis.verdict === "high_risk"
                              ? "#ef4444"
                              : "#f59e0b",
                      }}
                      onClick={() => router.push(`/analysis/${analysis.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                              {analysis.job.title || "Untitled Position"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {analysis.job.company || "Unknown Organization"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="font-semibold"
                              >
                                {analysis.matchScore}% Match
                              </Badge>
                              <Badge className={cn("gap-1.5", verdict.color)}>
                                <VerdictIcon className="h-3 w-3" />
                                {verdict.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 hidden sm:block">
                              {verdict.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 self-start sm:self-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/my-account/analysis/${analysis.id}`,
                              );
                            }}
                          >
                            View Analysis
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">No Analyses Yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-1 text-sm">
                      Compare this CV against job postings to see compatibility
                      scores and tailored recommendations.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/my-account/jobs")}
                    className="gap-2"
                  >
                    <Briefcase className="h-4 w-4" />
                    Browse Jobs
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 mt-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Optimization Recommendations
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions to improve your CV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formatIssues.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-5 w-5" />
                      Priority Fixes
                    </h3>
                    <div className="space-y-2">
                      {formatIssues
                        .slice(0, 3)
                        .map((issue: FormatIssue, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-200 text-red-700 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-sm text-red-900">
                                {issue.type}
                              </p>
                              <p className="text-xs text-red-700 mt-0.5">
                                {issue.message}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-blue-700">
                    <Sparkles className="h-5 w-5" />
                    Content Enhancements
                  </h3>
                  <div className="grid gap-2">
                    {cv.atsContentScore !== null && cv.atsContentScore < 70 && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-blue-900">
                            Strengthen Achievements
                          </p>
                          <p className="text-xs text-blue-700 mt-0.5">
                            Add quantifiable results and metrics to your
                            experience bullet points.
                          </p>
                        </div>
                      </div>
                    )}
                    {cv.keywordCoverage !== null && cv.keywordCoverage < 60 && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Target className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-blue-900">
                            Improve Keyword Coverage
                          </p>
                          <p className="text-xs text-blue-700 mt-0.5">
                            Include more industry-specific terminology from your
                            target job descriptions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div>
                      <h4 className="font-semibold text-amber-900">
                        Ready for a professional rewrite?
                      </h4>
                      <p className="text-sm text-amber-800 mt-0.5">
                        Our AI can optimize your CV for specific roles.
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        router.push(`/my-account/cv/${cv.id}/optimize`)
                      }
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white whitespace-nowrap"
                    >
                      <Zap className="h-4 w-4" />
                      Optimize Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="versions" className="space-y-4 mt-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cv.parent ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <GitBranch className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Parent Version</p>
                        <p className="text-xs text-muted-foreground">
                          Created{" "}
                          {formatDistanceToNow(new Date(cv.parent.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(`/my-account/cv/${cv.parent!.id}`)
                        }
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ) : cv.children && cv.children.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      {cv.children.length} optimized version
                      {cv.children.length !== 1 ? "s" : ""}
                    </p>
                    {cv.children.map((child: CVVersion) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              Optimized Version
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(child.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize"
                          >
                            {child.source}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/my-account/cv/${child.id}`)
                            }
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No version history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <GeneratePdfModal
          open={generateModalOpen}
          onOpenChange={setGenerateModalOpen}
          cvId={cv.id}
          cvName={displayName}
          cvTemplateId={cv.templateId}
        />

        <DeleteCVDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          cvName={displayName}
          onConfirm={handleDelete}
          isDeleting={deleteCV.isPending}
        />

        {cv.originalFileUrl && (
          <CVPreviewModal
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            fileUrl={cv.originalFileUrl}
            title={displayName}
          />
        )}
      </div>
    </div>
  );
}

function CVDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-6 max-w-7xl space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

function CVNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <div className="text-center max-w-md px-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
          <FileText className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Document Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The CV you`&apos;`re looking for doesn`&apos;`t exist or you
          don`&apos;`t have permission to access it.
        </p>
        <Button
          onClick={() => (window.location.href = "/my-account/cv")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Button>
      </div>
    </div>
  );
}
