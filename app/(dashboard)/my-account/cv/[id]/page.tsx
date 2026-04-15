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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteCVDialog } from "@/components/cv/delete-cv-dialog";
import { useCV, useDeleteCV, useReanalyzeCV } from "@/hooks/use-cvs";
import { useAnalysesByCV } from "@/hooks/use-analysis";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const verdictConfig = {
  proceed: {
    label: "Strong Match",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  consider: {
    label: "Moderate Fit",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Target,
  },
  high_risk: {
    label: "Low Compatibility",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
  },
};

function StatCard({ title, value, description, icon: Icon, trend }: any) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow">
      <div
        className={cn(
          "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10",
          trend === "up"
            ? "bg-emerald-500"
            : trend === "down"
              ? "bg-red-500"
              : "bg-blue-500",
        )}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function CVDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { data, isLoading, error } = useCV(id as string);
  const { data: analyses, isLoading: analysesLoading } = useAnalysesByCV(
    id as string,
  );
  const deleteCV = useDeleteCV();
  const reanalyzeMutation = useReanalyzeCV();

  const cv = data?.cvVersion;

  const handleDelete = async () => {
    if (!cv) return;
    await deleteCV.mutateAsync(cv.id);
    router.push("/cv");
  };

  const handleReanalyze = () => {
    if (cv) reanalyzeMutation.mutate(cv.id);
  };

  if (isLoading) return <CVDetailSkeleton />;
  if (error || !cv) return <CVNotFound />;

  const displayName =
    cv.name ||
    cv.originalFileUrl
      ?.split("/")
      .pop()
      ?.replace(/\.(pdf|docx)$/, "") ||
    `CV from ${formatDistanceToNow(new Date(cv.createdAt))}`;

  const formatIssues = Array.isArray(cv.formatIssues) ? cv.formatIssues : [];
  const hasIssues = formatIssues.length > 0;

  const formatScore = cv.atsFormatScore || 0;
  const contentScore = cv.atsContentScore || 0;
  const overallScore = Math.round((formatScore + contentScore) / 2);

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6 max-w-7xl">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/cv")}
          className="gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-semibold tracking-tight">
                {displayName}
              </h1>
              <Badge variant="outline" className="text-xs font-medium">
                <Clock className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(cv.createdAt), {
                  addSuffix: true,
                })}
              </Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI-analyzed and optimized for ATS compatibility
            </p>
          </div>
          <div className="flex items-center gap-3">
            {cv.originalFileUrl && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a
                  href={cv.originalFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleReanalyze}
              disabled={reanalyzeMutation.isPending}
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${reanalyzeMutation.isPending ? "animate-spin" : ""}`}
              />
              Re-analyze
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/my-account/cv/${cv.id}/optimize`)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Optimize CV
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Readiness Score */}
      <Card
        className={cn(
          "border-l-4",
          overallScore >= 80
            ? "border-l-emerald-500 bg-emerald-50/30"
            : overallScore >= 60
              ? "border-l-amber-500 bg-amber-50/30"
              : "border-l-red-500 bg-red-50/30",
        )}
      >
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Application Readiness</h3>
              <p className="text-sm text-muted-foreground">
                {overallScore >= 80
                  ? "Your CV is highly optimized and ready for executive applications"
                  : overallScore >= 60
                    ? "Good foundation with room for improvement in key areas"
                    : "Significant optimization recommended before applying"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div
                  className={cn(
                    "text-4xl font-bold",
                    overallScore >= 80
                      ? "text-emerald-600"
                      : overallScore >= 60
                        ? "text-amber-600"
                        : "text-red-600",
                  )}
                >
                  {overallScore}%
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Overall Score
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Format Compatibility
              </span>
              <span className="font-medium">{formatScore}%</span>
            </div>
            <Progress value={formatScore} className="h-2" />
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">Content Strength</span>
              <span className="font-medium">{contentScore}%</span>
            </div>
            <Progress value={contentScore} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Format Score"
          value={cv.atsFormatScore !== null ? `${cv.atsFormatScore}%` : "—"}
          description="ATS layout & structure"
          icon={Layout}
          trend={
            formatScore >= 80 ? "up" : formatScore >= 60 ? "neutral" : "down"
          }
        />
        <StatCard
          title="Content Score"
          value={cv.atsContentScore !== null ? `${cv.atsContentScore}%` : "—"}
          description="Keywords & achievements"
          icon={TrendingUp}
          trend={
            contentScore >= 80 ? "up" : contentScore >= 60 ? "neutral" : "down"
          }
        />
        <StatCard
          title="Parsing Confidence"
          value={
            cv.parsingConfidence !== null ? `${cv.parsingConfidence}%` : "—"
          }
          description="Data extraction accuracy"
          icon={FileText}
        />
        <StatCard
          title="Job Matches"
          value={String(analyses?.analyses?.length || 0)}
          description="Analyzed positions"
          icon={Briefcase}
        />
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="format" className="gap-2">
            <Layout className="h-4 w-4" />
            Format Analysis
            {hasIssues && (
              <span className="ml-1 w-2 h-2 rounded-full bg-red-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Job Matches
            {analyses?.analyses?.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {analyses.analyses.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="versions" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Versions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Extracted Profile
              </CardTitle>
              <CardDescription>
                Structured data identified from your CV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 overflow-auto max-h-[500px]">
                <pre className="text-sm font-mono leading-relaxed">
                  {JSON.stringify(cv.profile, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="format" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5" />
                    Format Analysis
                  </CardTitle>
                  <CardDescription>
                    ATS compatibility and structural review
                  </CardDescription>
                </div>
                {hasIssues && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formatIssues.length} issue
                    {formatIssues.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {hasIssues ? (
                <div className="space-y-3">
                  {formatIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-xl border transition-colors",
                        issue.severity === "high"
                          ? "bg-red-50/50 border-red-200 hover:border-red-300"
                          : issue.severity === "medium"
                            ? "bg-amber-50/50 border-amber-200 hover:border-amber-300"
                            : "bg-blue-50/50 border-blue-200 hover:border-blue-300",
                      )}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 mt-2 rounded-full flex-shrink-0",
                          issue.severity === "high"
                            ? "bg-red-500"
                            : issue.severity === "medium"
                              ? "bg-amber-500"
                              : "bg-blue-500",
                        )}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">
                            {issue.type}
                          </h4>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs capitalize",
                              issue.severity === "high"
                                ? "border-red-200 text-red-700 bg-red-50"
                                : issue.severity === "medium"
                                  ? "border-amber-200 text-amber-700 bg-amber-50"
                                  : "border-blue-200 text-blue-700 bg-blue-50",
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
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-lg">No Issues Detected</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Your CV format is optimized for ATS parsing. The structure,
                    fonts, and layout are all compatible with automated
                    screening systems.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          {analysesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : analyses?.analyses?.length ? (
            <div className="space-y-3">
              {analyses.analyses.map((analysis) => {
                const verdict =
                  verdictConfig[
                    analysis.verdict as keyof typeof verdictConfig
                  ] || verdictConfig.consider;
                const VerdictIcon = verdict.icon;

                return (
                  <Card
                    key={analysis.id}
                    className="group hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push(`/jobs/${analysis.jobId}`)}
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {analysis.job.title || "Untitled Position"}
                          </h3>
                          <p className="text-muted-foreground">
                            {analysis.job.company || "Unknown Organization"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="font-medium">
                              Match: {analysis.matchScore}%
                            </Badge>
                            <Badge className={cn("gap-1", verdict.color)}>
                              <VerdictIcon className="h-3 w-3" />
                              {verdict.label}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/jobs/${analysis.jobId}`);
                          }}
                        >
                          View Job
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
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">No Job Analyses Yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Navigate to a job posting and analyze this CV against it to
                    see compatibility scores and tailored recommendations.
                  </p>
                </div>
                <Button
                  variant="outline"
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

        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Version History</CardTitle>
              <CardDescription>Parent and child CV versions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cv.parent && (
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    Parent version
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => router.push(`/cv/${cv.parent.id}`)}
                  >
                    View original CV
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created{" "}
                    {formatDistanceToNow(new Date(cv.parent.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
              {cv.children && cv.children.length > 0 && (
                <div>
                  <p className="font-medium mb-2">
                    Optimized versions ({cv.children.length})
                  </p>
                  <div className="space-y-2">
                    {cv.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex justify-between items-center border-b pb-2 last:border-0"
                      >
                        <div>
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium"
                            onClick={() => router.push(`/cv/${child.id}`)}
                          >
                            View optimized CV
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Created{" "}
                            {formatDistanceToNow(new Date(child.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {child.source}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!cv.parent && (!cv.children || cv.children.length === 0) && (
                <p className="text-muted-foreground">
                  No version history available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteCVDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        cvName={displayName}
        onConfirm={handleDelete}
        isDeleting={deleteCV.isPending}
      />
    </div>
  );
}

function CVDetailSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6 max-w-7xl">
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-12 w-80" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

function CVNotFound() {
  return (
    <div className="container mx-auto py-12 px-4 text-center max-w-md">
      <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
        <FileText className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Document Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The CV you're looking for doesn't exist or you don't have permission to
        access it.
      </p>
      <Button onClick={() => (window.location.href = "/cv")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Return to Documents
      </Button>
    </div>
  );
}
