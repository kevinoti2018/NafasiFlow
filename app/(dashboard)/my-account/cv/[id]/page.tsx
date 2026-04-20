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
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  GraduationCap,
  Wrench,
  Code,
  Eye,
  Code2,
  ToggleLeft,
  ToggleRight,
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
import { CVEditModal } from "@/components/cv/cv-edit-modal";
import { CVInput } from "@/lib/ai/prompts";
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

// Unified verdict configuration
const verdictConfig = {
  proceed: {
    label: "Strong Match",
    color:
      "bg-[#005f78]/10 text-[#005f78] border-[#005f78]/20 dark:bg-[#005f78]/20 dark:text-[#4db8d4] dark:border-[#005f78]/30",
    icon: CheckCircle2,
    description: "High compatibility with job requirements",
  },
  consider: {
    label: "Moderate Fit",
    color:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-500 dark:border-amber-500/30",
    icon: Target,
    description: "Some alignment, may need tailoring",
  },
  high_risk: {
    label: "Low Compatibility",
    color:
      "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
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
        "relative overflow-hidden transition-all duration-300 bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-800",
        onClick && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
        "group",
      )}
      onClick={onClick}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110",
          trend === "up"
            ? "bg-[#005f78]"
            : trend === "down"
              ? "bg-rose-500"
              : "bg-slate-500",
        )}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </CardTitle>
        <div
          className={cn(
            "p-2 rounded-lg transition-colors",
            trend === "up"
              ? "bg-[#005f78]/10 text-[#005f78] dark:bg-[#005f78]/20 dark:text-[#4db8d4]"
              : trend === "down"
                ? "bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

// Profile UI View Component
// Profile UI View Component - Updated to handle actual data structure
function ProfileUIView({ profile }: { profile: any }) {
  if (!profile) return null;

  const sections = [
    {
      key: "summary",
      title: "Professional Summary",
      icon: FileText,
      render: () => (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {profile.summary}
        </p>
      ),
      condition: !!profile.summary,
    },
    {
      key: "experience",
      title: "Work Experience",
      icon: Briefcase,
      render: () => (
        <div className="space-y-4">
          {profile.experience?.map((exp: any, idx: number) => (
            <div key={idx} className="border-l-2 border-[#005f78]/30 pl-4 py-1">
              <div className="flex items-center gap-2 mb-1">
                <Building className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {exp.company}
                </h4>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {exp.role}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                {exp.duration}
              </p>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul className="space-y-1">
                  {exp.bullets.map((bullet: string, bIdx: number) => (
                    <li
                      key={bIdx}
                      className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"
                    >
                      <span className="text-[#005f78] dark:text-[#4db8d4] mt-0.5">
                        •
                      </span>
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ),
      condition: profile.experience && profile.experience.length > 0,
    },
    {
      key: "education",
      title: "Education",
      icon: GraduationCap,
      render: () => (
        <div className="space-y-3">
          {profile.education?.map((edu: any, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <GraduationCap className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {edu.degree}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {edu.institution}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  {edu.year}
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
      condition: profile.education && profile.education.length > 0,
    },
    {
      key: "skills",
      title: "Skills",
      icon: Wrench,
      render: () => (
        <div className="flex flex-wrap gap-2">
          {profile.skills?.map((skill: string, idx: number) => (
            <Badge
              key={idx}
              variant="secondary"
              className="bg-[#005f78]/10 text-[#005f78] dark:bg-[#005f78]/20 dark:text-[#4db8d4] border-[#005f78]/20 dark:border-[#005f78]/30"
            >
              {skill}
            </Badge>
          ))}
        </div>
      ),
      condition: profile.skills && profile.skills.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        if (!section.condition) return null;

        const Icon = section.icon;
        return (
          <div
            key={section.key}
            className="bg-white dark:bg-[#1c2225] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161b1d]/50">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {section.title}
                </h3>
              </div>
            </div>
            <div className="p-4">{section.render()}</div>
          </div>
        );
      })}
    </div>
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
      ? "text-[#005f78] dark:text-[#4db8d4]"
      : score >= 60
        ? "text-amber-500"
        : "text-rose-500";
  const bgColor = "text-slate-200 dark:text-slate-800";

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
        <span className={cn("text-2xl font-bold", color)}>{score}%</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-500 uppercase">
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
  const [profileViewMode, setProfileViewMode] = useState<"ui" | "raw">("ui");
  const { data, isLoading, error } = useCV(id as string);
  const [editModalOpen, setEditModalOpen] = useState(false);

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

  const analysisList = (analyses?.analyses as AnalysisResult[]) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl space-y-6 sm:space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/my-account/cv")}
            className="gap-2 h-auto py-1 px-2 -ml-2 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Documents
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 dark:text-slate-100 font-medium truncate max-w-[200px] sm:max-w-md">
            {displayName}
          </span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 sm:gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
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
                className={cn(
                  "mt-1",
                  isOptimized && "bg-[#005f78] text-white hover:bg-[#004a5e]",
                  needsWork && "bg-rose-600 text-white",
                  !isOptimized && !needsWork && "bg-slate-600 text-white",
                )}
              >
                {isOptimized
                  ? "ATS Optimized"
                  : needsWork
                    ? "Needs Improvement"
                    : "Good"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Uploaded{" "}
                {formatDistanceToNow(new Date(cv.createdAt), {
                  addSuffix: true,
                })}
              </span>
              {cv.originalFileUrl && (
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
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
              className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10 hover:text-[#005f78] dark:hover:text-[#4db8d4]"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-700"
              >
                {cv.originalFileUrl && (
                  <DropdownMenuItem
                    asChild
                    className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                  >
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
                  className="gap-2 text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                >
                  <FileText className="h-4 w-4" />
                  Generate PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleReanalyze}
                  disabled={reanalyzeMutation.isPending}
                  className="gap-2 text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
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
                  className="gap-2 text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Optimize with AI
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="gap-2 text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => router.push(`/my-account/cv/${cv.id}/optimize`)}
              className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white"
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
              ? "bg-gradient-to-br from-[#005f78]/10 to-[#007a99]/10 dark:from-[#005f78]/20 dark:to-[#007a99]/20"
              : needsWork
                ? "bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30"
                : "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30",
          )}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              <div className="flex-shrink-0">
                <ScoreRing score={overallScore} size={140} />
              </div>
              <div className="flex-1 w-full space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {isOptimized
                      ? "Excellent ATS Compatibility"
                      : needsWork
                        ? "Requires Significant Improvement"
                        : "Good Foundation with Room to Grow"}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        Format & Structure
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          formatScore >= 80
                            ? "text-[#005f78] dark:text-[#4db8d4]"
                            : formatScore >= 60
                              ? "text-amber-600"
                              : "text-rose-600",
                        )}
                      >
                        {formatScore}%
                      </span>
                    </div>
                    <Progress
                      value={formatScore}
                      className="h-2.5 bg-slate-200 dark:bg-slate-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Content & Keywords
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          contentScore >= 80
                            ? "text-[#005f78] dark:text-[#4db8d4]"
                            : contentScore >= 60
                              ? "text-amber-600"
                              : "text-rose-600",
                        )}
                      >
                        {contentScore}%
                      </span>
                    </div>
                    <Progress
                      value={contentScore}
                      className="h-2.5 bg-slate-200 dark:bg-slate-700"
                    />
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
            <TabsList className="inline-flex w-auto min-w-full sm:w-full bg-slate-100 dark:bg-[#161b1d] p-1 border border-slate-200 dark:border-slate-800">
              <TabsTrigger
                value="overview"
                className="gap-2 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c2225] data-[state=active]:text-[#005f78] dark:data-[state=active]:text-[#4db8d4]"
              >
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="format"
                className="gap-2 text-xs sm:text-sm relative data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c2225] data-[state=active]:text-[#005f78] dark:data-[state=active]:text-[#4db8d4]"
              >
                <Layout className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Format
                {hasIssues && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background" />
                )}
              </TabsTrigger>
              <TabsTrigger
                value="jobs"
                className="gap-2 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c2225] data-[state=active]:text-[#005f78] dark:data-[state=active]:text-[#4db8d4]"
              >
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Matches
                {analysisList.length > 0 && (
                  <span className="ml-1 text-[10px] bg-[#005f78] text-white px-1.5 py-0.5 rounded-full">
                    {analysisList.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="gap-2 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c2225] data-[state=active]:text-[#005f78] dark:data-[state=active]:text-[#4db8d4]"
              >
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Recommendations</span>
                <span className="sm:hidden">Tips</span>
              </TabsTrigger>
              <TabsTrigger
                value="versions"
                className="gap-2 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c2225] data-[state=active]:text-[#005f78] dark:data-[state=active]:text-[#4db8d4]"
              >
                <GitBranch className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Versions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 mt-2">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2225]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Sparkles className="h-5 w-5 text-[#005f78] dark:text-[#4db8d4]" />
                      Extracted Profile
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      AI-structured data from your CV
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setProfileViewMode(
                          profileViewMode === "ui" ? "raw" : "ui",
                        )
                      }
                      className="gap-2 text-slate-600 dark:text-slate-400 hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                    >
                      {profileViewMode === "ui" ? (
                        <>
                          <Code2 className="h-4 w-4" />
                          <span className="hidden sm:inline">View Raw</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">View UI</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-slate-600 dark:text-slate-400 hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                      onClick={() => setEditModalOpen(true)}
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {profileViewMode === "ui" ? (
                  <ProfileUIView profile={cv.profile} />
                ) : (
                  <div className="bg-slate-950 rounded-lg p-4 overflow-auto max-h-[500px]">
                    <pre className="text-xs sm:text-sm font-mono text-slate-50 leading-relaxed">
                      {JSON.stringify(cv.profile, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="format" className="space-y-4 mt-2">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2225]">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Layout className="h-5 w-5 text-[#005f78] dark:text-[#4db8d4]" />
                      Format Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                      ATS compatibility and structure review
                    </CardDescription>
                  </div>
                  {hasIssues ? (
                    <Badge
                      variant="destructive"
                      className="w-fit gap-1.5 bg-rose-600"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      {formatIssues.length} issue
                      {formatIssues.length !== 1 ? "s" : ""} found
                    </Badge>
                  ) : (
                    <Badge className="w-fit gap-1.5 bg-[#005f78]/10 text-[#005f78] dark:bg-[#005f78]/20 dark:text-[#4db8d4] hover:bg-[#005f78]/10">
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
                            ? "bg-rose-50/80 border-rose-200 dark:bg-rose-950/20 dark:border-rose-800"
                            : issue.severity === "medium"
                              ? "bg-amber-50/80 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                              : "bg-blue-50/80 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800",
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                            issue.severity === "high"
                              ? "bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                              : issue.severity === "medium"
                                ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                                : "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
                          )}
                        >
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {issue.type}
                            </h4>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase tracking-wide",
                                issue.severity === "high"
                                  ? "border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:bg-rose-950/30"
                                  : issue.severity === "medium"
                                    ? "border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950/30"
                                    : "border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950/30",
                              )}
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {issue.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-[#005f78]/10 dark:bg-[#005f78]/20 flex items-center justify-center">
                      <CheckCircle2 className="h-10 w-10 text-[#005f78] dark:text-[#4db8d4]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                        Perfect Format
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
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
                  <Skeleton
                    key={i}
                    className="h-28 w-full bg-slate-200 dark:bg-slate-800"
                  />
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
                      className="group cursor-pointer hover:shadow-lg transition-all border-l-4 bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-800"
                      style={{
                        borderLeftColor:
                          analysis.verdict === "proceed"
                            ? "#005f78"
                            : analysis.verdict === "high_risk"
                              ? "#ef4444"
                              : "#f59e0b",
                      }}
                      onClick={() => router.push(`/analysis/${analysis.id}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 group-hover:text-[#005f78] dark:group-hover:text-[#4db8d4] transition-colors">
                              {analysis.job.title || "Untitled Position"}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {analysis.job.company || "Unknown Organization"}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge
                                variant="secondary"
                                className="font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {analysis.matchScore}% Match
                              </Badge>
                              <Badge className={cn("gap-1.5", verdict.color)}>
                                <VerdictIcon className="h-3 w-3" />
                                {verdict.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 hidden sm:block">
                              {verdict.description}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 self-start sm:self-center opacity-0 group-hover:opacity-100 transition-opacity text-[#005f78] dark:text-[#4db8d4] hover:bg-[#005f78]/10 dark:hover:bg-[#005f78]/10"
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
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2225]">
                <CardContent className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Briefcase className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                      No Analyses Yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 text-sm">
                      Compare this CV against job postings to see compatibility
                      scores and tailored recommendations.
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/my-account/jobs")}
                    className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white"
                  >
                    <Briefcase className="h-4 w-4" />
                    Browse Jobs
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4 mt-2">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2225]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Award className="h-5 w-5 text-[#005f78] dark:text-[#4db8d4]" />
                  Optimization Recommendations
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  AI-powered suggestions to improve your CV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Priority Fixes */}
                {formatIssues.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 text-rose-700 dark:text-rose-400">
                      <AlertCircle className="h-5 w-5" />
                      Priority Fixes
                    </h3>
                    <div className="space-y-2">
                      {formatIssues
                        .slice(0, 3)
                        .map((issue: FormatIssue, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-200 dark:border-rose-800"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-700 dark:text-rose-400 flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-sm text-rose-900 dark:text-rose-100">
                                {issue.type}
                              </p>
                              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                                {issue.message}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Missing Important Sections */}
                {Array.isArray(cv.missingSections) &&
                  cv.missingSections.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        <AlertCircle className="h-5 w-5" />
                        Missing Important Sections
                      </h3>
                      <div className="space-y-2">
                        {cv.missingSections.map(
                          (section: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
                            >
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-200 dark:bg-orange-900 text-orange-700 dark:text-orange-400 flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-medium text-sm text-orange-900 dark:text-orange-100 capitalize">
                                  {section} section missing
                                </p>
                                <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">
                                  Add your {section} details to improve
                                  completeness and ATS ranking.
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {/* Content Enhancements */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-[#005f78] dark:text-[#4db8d4]">
                    <Sparkles className="h-5 w-5" />
                    Content Enhancements
                  </h3>
                  <div className="grid gap-2">
                    {/* Low content score warning */}
                    {cv.atsContentScore !== null && cv.atsContentScore < 70 && (
                      <div className="flex items-start gap-3 p-3 bg-[#005f78]/5 dark:bg-[#005f78]/10 rounded-lg border border-[#005f78]/20 dark:border-[#005f78]/30">
                        <TrendingUp className="h-5 w-5 text-[#005f78] dark:text-[#4db8d4] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            Strengthen Achievements
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            Add quantifiable results and metrics to your
                            experience bullet points.
                          </p>
                        </div>
                      </div>
                    )}
                    {/* High content score positive feedback */}
                    {cv.atsContentScore !== null &&
                      cv.atsContentScore >= 70 && (
                        <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm text-emerald-900 dark:text-emerald-100">
                              Great content quality!
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                              Your CV has strong keyword coverage and impactful
                              bullet points.
                            </p>
                          </div>
                        </div>
                      )}
                    {/* Low keyword coverage warning */}
                    {cv.keywordCoverage !== null && cv.keywordCoverage < 60 && (
                      <div className="flex items-start gap-3 p-3 bg-[#005f78]/5 dark:bg-[#005f78]/10 rounded-lg border border-[#005f78]/20 dark:border-[#005f78]/30">
                        <Target className="h-5 w-5 text-[#005f78] dark:text-[#4db8d4] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            Improve Keyword Coverage
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            Include more industry‑specific terminology from your
                            target job descriptions.
                          </p>
                        </div>
                      </div>
                    )}
                    {/* High keyword coverage positive feedback */}
                    {cv.keywordCoverage !== null &&
                      cv.keywordCoverage >= 60 && (
                        <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm text-emerald-900 dark:text-emerald-100">
                              Good keyword density
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                              Your CV contains relevant industry terms that
                              align with job requirements.
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Call to Action */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-[#005f78]/10 to-[#007a99]/10 dark:from-[#005f78]/20 dark:to-[#007a99]/20 rounded-xl border border-[#005f78]/20 dark:border-[#005f78]/30">
                    <div>
                      <h4 className="font-semibold text-[#005f78] dark:text-[#4db8d4]">
                        Ready for a professional rewrite?
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                        Our AI can optimize your CV for specific roles.
                      </p>
                    </div>
                    <Button
                      onClick={() =>
                        router.push(`/my-account/cv/${cv.id}/optimize`)
                      }
                      className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white whitespace-nowrap"
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
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1c2225]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <GitBranch className="h-5 w-5 text-[#005f78] dark:text-[#4db8d4]" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cv.parent ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-[#005f78]/10 dark:bg-[#005f78]/20 flex items-center justify-center">
                        <GitBranch className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                          Parent Version
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
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
                        className="text-[#005f78] dark:text-[#4db8d4] hover:bg-[#005f78]/10 dark:hover:bg-[#005f78]/10"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ) : cv.children && cv.children.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                      {cv.children.length} optimized version
                      {cv.children.length !== 1 ? "s" : ""}
                    </p>
                    {cv.children.map((child: CVVersion) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#005f78]/10 dark:bg-[#005f78]/20 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                              Optimized Version
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">
                              {formatDistanceToNow(new Date(child.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs capitalize border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          >
                            {child.source}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/my-account/cv/${child.id}`)
                            }
                            className="text-[#005f78] dark:text-[#4db8d4] hover:bg-[#005f78]/10 dark:hover:bg-[#005f78]/10"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400">
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
        <CVEditModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          cvId={cv.id}
          initialData={cv.profile as CVInput}
          cvName={displayName}
          onRestructure={async () => {
            // Optional: trigger re-structuring if needed
            const res = await fetch(`/api/cv/${cv.id}/restructure`, {
              method: "POST",
            });
            if (res.ok) {
              // Refetch CV data
              await refetch();
            }
          }}
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      <div className="container mx-auto py-8 px-6 max-w-7xl space-y-8">
        <Skeleton className="h-8 w-32 bg-slate-200 dark:bg-slate-800" />
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-48 bg-slate-200 dark:bg-slate-800" />
          </div>
          <Skeleton className="h-10 w-32 bg-slate-200 dark:bg-slate-800" />
        </div>
        <Skeleton className="h-40 w-full bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-28 w-full bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
        <Skeleton className="h-12 w-full bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-96 w-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function CVNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#161b1d]">
      <div className="text-center max-w-md px-6">
        <div className="w-24 h-24 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
          <FileText className="h-12 w-12 text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">
          Document Not Found
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          The CV you're looking for doesn't exist or you don't have permission
          to access it.
        </p>
        <Button
          onClick={() => (window.location.href = "/my-account/cv")}
          className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documents
        </Button>
      </div>
    </div>
  );
}
