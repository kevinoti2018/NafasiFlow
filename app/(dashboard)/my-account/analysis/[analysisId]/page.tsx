// app/(dashboard)/analysis/[analysisId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  FileText,
  Briefcase,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Target,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Award,
  Building2,
  MapPin,
  Clock,
  ChevronRight,
  Lightbulb,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Share2,
  RefreshCw,
  BrainCircuit,
  FileSearch,
  BadgeCheck,
  ArrowUpRight,
  Quote,
  Info,
  Menu,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAnalysis } from "@/hooks/use-analysis";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Types for AI output
type CriticalGap = {
  gap: string;
  fix: string;
  impact: "high" | "medium" | "low";
};

type CompetencyMapping = {
  jobRequirement: string;
  candidateEvidence: string;
  relevance: "direct" | "transferable" | "implied";
};

type ExperienceTransformation = {
  role: string;
  originalBullets: string[];
  optimizedBullets: string[];
  injectedKeywords: string[];
};

type SellData = {
  positioning?: {
    angle: string;
    rationale: string;
    keyThemes: string[];
  };
  profileOptimization?: {
    originalHeadline: string;
    optimizedHeadline: string;
    elevatorPitch: string;
  };
  experienceTransformations?: ExperienceTransformation[];
  competencyMapping?: CompetencyMapping[];
};

type MatchData = {
  matchScore?: number;
  rationale?: string;
  confidence?: number;
  eligibility?: {
    seniorityGap?: -1 | 0 | 1;
    isRemoteCompatible?: boolean | null;
  };
  scoreBreakdown?: Record<string, number>;
  criticalGaps?: CriticalGap[];
  recommendations?: string[];
  verdict?: "proceed" | "consider" | "high_risk";
};

// Unified verdict configuration using consistent teal theme
const verdictConfig = {
  proceed: {
    label: "Strong Match",
    color:
      "bg-[#005f78]/10 text-[#005f78] border-[#005f78]/20 dark:bg-[#005f78]/20 dark:text-[#4db8d4] dark:border-[#005f78]/30",
    icon: CheckCircle2,
    gradient: "from-[#005f78] to-[#007a99]",
    bgGradient:
      "from-[#005f78]/10 to-[#007a99]/10 dark:from-[#005f78]/20 dark:to-[#007a99]/20",
    description: "Excellent alignment with job requirements",
  },
  consider: {
    label: "Moderate Fit",
    color:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-500 dark:border-amber-500/30",
    icon: Target,
    gradient: "from-amber-500 to-orange-600",
    bgGradient:
      "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    description: "Good potential with some gaps to address",
  },
  high_risk: {
    label: "Low Compatibility",
    color:
      "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
    icon: AlertCircle,
    gradient: "from-rose-500 to-rose-600",
    bgGradient:
      "from-rose-50 to-rose-50 dark:from-rose-950/30 dark:to-rose-950/30",
    description: "Significant gaps in requirements",
  },
};

// Unified impact configuration
const impactConfig = {
  high: {
    color:
      "text-rose-700 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-800",
    icon: AlertTriangle,
  },
  medium: {
    color:
      "text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-950/30 dark:border-amber-800",
    icon: AlertCircle,
  },
  low: {
    color:
      "text-[#005f78] bg-[#005f78]/10 border-[#005f78]/20 dark:text-[#4db8d4] dark:bg-[#005f78]/20 dark:border-[#005f78]/30",
    icon: Info,
  },
};

// Unified relevance configuration
const relevanceConfig = {
  direct: {
    color:
      "bg-[#005f78]/10 text-[#005f78] border-[#005f78]/20 dark:bg-[#005f78]/20 dark:text-[#4db8d4] dark:border-[#005f78]/30",
    label: "Direct Match",
  },
  transferable: {
    color:
      "bg-[#005f78]/5 text-[#005f78]/80 border-[#005f78]/10 dark:bg-[#005f78]/10 dark:text-[#4db8d4]/80 dark:border-[#005f78]/20",
    label: "Transferable",
  },
  implied: {
    color:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    label: "Implied",
  },
};

// Unified score color scale
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

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext: string;
  trend?: "up" | "down" | "neutral";
  highlight?: "warning" | "success" | "primary";
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  trend,
  highlight,
}: MetricCardProps) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-[#005f78] dark:text-[#4db8d4]"
      : trend === "down"
        ? "text-rose-600 dark:text-rose-400"
        : "text-slate-400";

  return (
    <Card className="relative overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-[#1c2225]">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "p-1.5 sm:p-2 rounded-lg",
              highlight === "warning"
                ? "bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                : highlight === "success"
                  ? "bg-[#005f78]/10 text-[#005f78] dark:bg-[#005f78]/20 dark:text-[#4db8d4]"
                  : highlight === "primary"
                    ? "bg-[#005f78]/10 text-[#005f78] dark:bg-[#005f78]/20 dark:text-[#4db8d4]"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
            )}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          {trend && (
            <TrendIcon className={cn("h-3 w-3 sm:h-4 sm:w-4", trendColor)} />
          )}
        </div>
        <div className="mt-2 sm:mt-4">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mt-0.5 sm:mt-1 truncate">
            {value}
          </p>
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-500 mt-0.5 sm:mt-1">
            {subtext}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalysisDetailPage() {
  const { analysisId } = useParams();
  const router = useRouter();
  const { data, isLoading, error } = useAnalysis(analysisId as string);
  const [activeTab, setActiveTab] = useState("match");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) return <AnalysisSkeleton />;
  if (error || !data?.analysis) return <AnalysisNotFound />;

  const analysis = data.analysis;
  const matchData = analysis.analysis?.match as MatchData | undefined;
  const sellData = analysis.analysis?.sell as SellData | undefined;
  const rawMatchData = matchData || (analysis.analysis as MatchData);

  const verdict = rawMatchData?.verdict || "consider";
  const verdictInfo =
    verdictConfig[verdict as keyof typeof verdictConfig] ||
    verdictConfig.consider;
  const VerdictIcon = verdictInfo.icon;

  const matchScore = analysis.matchScore || 0;
  const confidence = rawMatchData?.confidence || 0;

  const seniorityGap = rawMatchData?.eligibility?.seniorityGap;
  const seniorityText =
    seniorityGap === -1 ? "Junior" : seniorityGap === 1 ? "Senior" : "Match";

  const isRemote = rawMatchData?.eligibility?.isRemoteCompatible;
  const remoteText =
    isRemote === true
      ? "Compatible"
      : isRemote === false
        ? "On-site"
        : "Unknown";

  const gapsCount = rawMatchData?.criticalGaps?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      {/* Hero Section - Clean, unified gradient */}
      <div
        className={cn(
          "relative overflow-hidden border-b border-slate-200 dark:border-slate-800",
          `bg-gradient-to-br ${verdictInfo.bgGradient}`,
        )}
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-white/40 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12 relative">
          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4 sm:mb-6"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 -ml-2 sm:ml-0 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </motion.div>

          {/* Main Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-3 sm:space-y-4 flex-1 min-w-0"
            >
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Badge
                  variant="outline"
                  className="gap-1.5 px-2 sm:px-3 py-1 text-xs sm:text-sm border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <BrainCircuit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">AI Analysis</span>
                  <span className="sm:hidden">AI</span>
                </Badge>
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {format(new Date(analysis.createdAt), "MMM d, yyyy")}
                </span>
              </div>

              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 break-words">
                  {analysis.job?.title || "Job Analysis"}
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-slate-500 dark:text-slate-400 text-sm">
                  {analysis.job?.company && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="truncate">{analysis.job.company}</span>
                    </span>
                  )}
                  {analysis.cvVersion?.id && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 gap-1 text-xs sm:text-sm text-slate-500 hover:text-[#005f78] dark:text-slate-400 dark:hover:text-[#4db8d4]"
                      onClick={() =>
                        router.push(`/my-account/cv/${analysis.cvVersion.id}`)
                      }
                    >
                      <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="truncate">
                        {analysis.cvVersion.name || "View CV"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Score Circle - Unified teal gradient */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 sm:gap-6 shrink-0"
            >
              <div className="relative">
                <svg className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - matchScore / 100)}`}
                    className={cn("transition-all duration-1000 ease-out")}
                    style={{ stroke: `url(#gradient-${verdict})` }}
                  />
                  <defs>
                    <linearGradient
                      id={`gradient-proceed`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#005f78" />
                      <stop offset="100%" stopColor="#007a99" />
                    </linearGradient>
                    <linearGradient
                      id={`gradient-consider`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                    <linearGradient
                      id={`gradient-high_risk`}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#e11d48" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      "text-xl sm:text-2xl md:text-3xl font-bold",
                      getScoreColor(matchScore),
                    )}
                  >
                    {matchScore}%
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Match
                  </span>
                </div>
              </div>

              <div className="space-y-1 sm:space-y-2">
                <Badge
                  className={cn(
                    "gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium",
                    verdictInfo.color,
                  )}
                >
                  <VerdictIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{verdictInfo.label}</span>
                  <span className="sm:hidden">
                    {verdict === "proceed"
                      ? "Strong"
                      : verdict === "consider"
                        ? "Moderate"
                        : "Low"}
                  </span>
                </Badge>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-[150px] sm:max-w-[200px] hidden sm:block">
                  {verdictInfo.description}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-7xl">
        {/* Key Metrics Grid - Unified teal theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
        >
          <MetricCard
            icon={BarChart3}
            label="AI Confidence"
            value={`${confidence}%`}
            subtext="In analysis accuracy"
            trend={
              confidence > 80 ? "up" : confidence > 50 ? "neutral" : "down"
            }
            highlight={confidence > 80 ? "success" : "primary"}
          />
          <MetricCard
            icon={Briefcase}
            label="Seniority"
            value={seniorityText}
            subtext="Level alignment"
            trend={seniorityGap === 0 ? "up" : "neutral"}
            highlight={seniorityGap === 0 ? "success" : "primary"}
          />
          <MetricCard
            icon={MapPin}
            label="Remote Work"
            value={remoteText}
            subtext="Work arrangement"
            highlight="primary"
          />
          <MetricCard
            icon={Zap}
            label="Key Gaps"
            value={gapsCount}
            subtext="Areas to address"
            highlight={gapsCount > 0 ? "warning" : "success"}
          />
        </motion.div>

        {/* Score Breakdown */}
        {rawMatchData?.scoreBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1c2225]">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#161b1d]/50 px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-[#005f78] dark:text-[#4db8d4]" />
                      Score Breakdown
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Detailed scoring across key dimensions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(rawMatchData.scoreBreakdown).map(
                    ([key, value], idx) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        className="space-y-2 sm:space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <span
                            className={cn(
                              "text-xs sm:text-sm font-bold",
                              getScoreColor(value as number),
                            )}
                          >
                            {value}%
                          </span>
                        </div>
                        <Progress
                          value={value as number}
                          className={cn(
                            "h-1.5 sm:h-2 bg-slate-200 dark:bg-slate-700",
                            (value as number) >= 80
                              ? "[&>div]:bg-[#005f78]"
                              : (value as number) >= 60
                                ? "[&>div]:bg-amber-500"
                                : "[&>div]:bg-rose-500",
                          )}
                        />
                      </motion.div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Detailed Analysis Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4 sm:space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center justify-between sm:hidden">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {activeTab === "match"
                    ? "Match Analysis"
                    : activeTab === "sell"
                      ? "Optimization"
                      : "Raw Data"}
                </span>
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 border-slate-200 dark:border-slate-700"
                    >
                      <Menu className="h-4 w-4" />
                      Tabs
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="h-auto bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex flex-col gap-2 p-4">
                      <Button
                        variant={activeTab === "match" ? "default" : "ghost"}
                        className="justify-start gap-2 bg-[#005f78] text-white hover:bg-[#004a5e]"
                        onClick={() => {
                          setActiveTab("match");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <FileSearch className="h-4 w-4" />
                        Match Analysis
                      </Button>
                      {sellData && (
                        <Button
                          variant={activeTab === "sell" ? "default" : "ghost"}
                          className="justify-start gap-2 bg-[#005f78] text-white hover:bg-[#004a5e]"
                          onClick={() => {
                            setActiveTab("sell");
                            setMobileMenuOpen(false);
                          }}
                        >
                          <Sparkles className="h-4 w-4" />
                          Optimization
                        </Button>
                      )}
                      <Button
                        variant={activeTab === "raw" ? "default" : "ghost"}
                        className="justify-start gap-2 bg-[#005f78] text-white hover:bg-[#004a5e]"
                        onClick={() => {
                          setActiveTab("raw");
                          setMobileMenuOpen(false);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        Raw Data
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <TabsList className="hidden sm:flex bg-slate-100 dark:bg-[#161b1d] p-1 rounded-xl h-auto flex-wrap border border-slate-200 dark:border-slate-800">
                <TabsTrigger
                  value="match"
                  className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c2225] data-[state=active]:shadow-sm data-[state=active]:text-[#005f78] dark:data-[state=active]:text-[#4db8d4] text-xs sm:text-sm py-2 px-3"
                >
                  <FileSearch className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Match Analysis
                </TabsTrigger>
                {sellData && (
                  <TabsTrigger
                    value="sell"
                    className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c2225] data-[state=active]:shadow-sm data-[state=active]:text-[#005f78] dark:data-[state=active]:text-[#4db8d4] text-xs sm:text-sm py-2 px-3"
                  >
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Optimization
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="raw"
                  className="rounded-lg gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1c2225] data-[state=active]:shadow-sm data-[state=active]:text-[#005f78] dark:data-[state=active]:text-[#4db8d4] text-xs sm:text-sm py-2 px-3"
                >
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Raw Data
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs sm:text-sm h-8 sm:h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10 hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                >
                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs sm:text-sm h-8 sm:h-9 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10 hover:text-[#005f78] dark:hover:text-[#4db8d4]"
                >
                  <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent
                value="match"
                className="space-y-4 sm:space-y-6 mt-0"
              >
                {/* AI Rationale */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1c2225]">
                  <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
                      <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5 text-[#005f78] dark:text-[#4db8d4]" />
                      AI Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-200 dark:border-slate-800">
                      <Quote className="h-4 w-4 sm:h-5 sm:w-5 text-[#005f78] dark:text-[#4db8d4] mb-2" />
                      <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                        {rawMatchData?.rationale ||
                          "No rationale provided by the AI."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Critical Gaps */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1c2225]">
                  <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                      Critical Gaps & Recommendations
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Issues identified and how to address them
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    {rawMatchData?.criticalGaps?.length ? (
                      <div className="space-y-3 sm:space-y-4">
                        {rawMatchData.criticalGaps.map(
                          (gap: CriticalGap, i: number) => {
                            const impact = impactConfig[gap.impact];
                            const ImpactIcon = impact.icon;
                            return (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors"
                              >
                                <div
                                  className={cn(
                                    "shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
                                    impact.color,
                                  )}
                                >
                                  <ImpactIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                                    <h4 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                                      {gap.gap}
                                    </h4>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "shrink-0 text-xs w-fit",
                                        impact.color,
                                      )}
                                    >
                                      {gap.impact} impact
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                    <span className="font-medium text-[#005f78] dark:text-[#4db8d4]">
                                      Fix:{" "}
                                    </span>
                                    {gap.fix}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          },
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#005f78]/10 dark:bg-[#005f78]/20 flex items-center justify-center mb-3 sm:mb-4">
                          <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-[#005f78] dark:text-[#4db8d4]" />
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100">
                          No Critical Gaps
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 px-4">
                          Great job! The AI didn't identify any major gaps in
                          your profile for this role.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recommendations */}
                {rawMatchData?.recommendations &&
                  rawMatchData.recommendations.length > 0 && (
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1c2225]">
                      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
                          <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                          Strategic Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                        <ul className="space-y-2 sm:space-y-3">
                          {rawMatchData.recommendations.map(
                            (rec: string, i: number) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex gap-2 sm:gap-3 items-start"
                              >
                                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#005f78]/10 dark:bg-[#005f78]/20 text-[#005f78] dark:text-[#4db8d4] flex items-center justify-center text-xs font-bold">
                                  {i + 1}
                                </span>
                                <span className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 pt-0.5">
                                  {rec}
                                </span>
                              </motion.li>
                            ),
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              {sellData && (
                <TabsContent
                  value="sell"
                  className="space-y-4 sm:space-y-6 mt-0"
                >
                  {/* Positioning Strategy */}
                  {sellData.positioning && (
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-[#1c2225]">
                      <div
                        className={cn(
                          "h-1.5 sm:h-2 bg-gradient-to-r",
                          verdictInfo.gradient,
                        )}
                      />
                      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
                          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-[#005f78] dark:text-[#4db8d4]" />
                          Positioning Strategy
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Angle
                          </h4>
                          <p className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                            {sellData.positioning.angle}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Rationale
                          </h4>
                          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                            {sellData.positioning.rationale}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                            Key Themes
                          </h4>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {sellData.positioning.keyThemes?.map(
                              (theme: string) => (
                                <Badge
                                  key={theme}
                                  className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm bg-[#005f78]/10 text-[#005f78] border-[#005f78]/20 dark:bg-[#005f78]/20 dark:text-[#4db8d4] dark:border-[#005f78]/30 hover:bg-[#005f78]/20 dark:hover:bg-[#005f78]/30"
                                >
                                  {theme}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Profile Optimization */}
                  {sellData.profileOptimization && (
                    <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1c2225]">
                      <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
                          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                          Profile Optimization
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                          <div className="space-y-2">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Original Headline
                            </h4>
                            <div className="p-3 sm:p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-500 line-through decoration-slate-400 text-sm sm:text-base">
                              {sellData.profileOptimization.originalHeadline}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Optimized Headline
                            </h4>
                            <div className="p-3 sm:p-4 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/20 border border-[#005f78]/20 dark:border-[#005f78]/30 text-[#005f78] dark:text-[#4db8d4] font-medium text-sm sm:text-base">
                              {sellData.profileOptimization.optimizedHeadline}
                            </div>
                          </div>
                        </div>
                        <Separator className="bg-slate-100 dark:bg-slate-800" />
                        <div>
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 sm:mb-3">
                            Elevator Pitch
                          </h4>
                          <div className="p-3 sm:p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <Quote className="h-4 w-4 sm:h-5 sm:w-5 text-[#005f78] dark:text-[#4db8d4] mb-2" />
                            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 italic leading-relaxed">
                              "{sellData.profileOptimization.elevatorPitch}"
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Experience Transformations */}
                  {sellData.experienceTransformations?.map(
                    (exp: ExperienceTransformation, idx: number) => (
                      <Card
                        key={idx}
                        className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1c2225]"
                      >
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
                            {exp.role}
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            Experience optimization with keyword injection
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6 space-y-4 sm:space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500" />
                                Original
                              </h4>
                              <ul className="space-y-1.5 sm:space-y-2">
                                {exp.originalBullets?.map(
                                  (b: string, i: number) => (
                                    <li
                                      key={i}
                                      className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 line-through decoration-slate-400/50 pl-3 sm:pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400"
                                    >
                                      {b}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#005f78] dark:text-[#4db8d4]" />
                                Optimized
                              </h4>
                              <ul className="space-y-1.5 sm:space-y-2">
                                {exp.optimizedBullets?.map(
                                  (b: string, i: number) => (
                                    <li
                                      key={i}
                                      className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 pl-3 sm:pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[#005f78] dark:before:text-[#4db8d4] font-medium"
                                    >
                                      {b}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          </div>
                          {exp.injectedKeywords?.length > 0 && (
                            <>
                              <Separator className="bg-slate-100 dark:bg-slate-800" />
                              <div>
                                <h4 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                  Injected Keywords
                                </h4>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  {exp.injectedKeywords.map((kw: string) => (
                                    <Badge
                                      key={kw}
                                      variant="outline"
                                      className="gap-1 border-[#005f78]/30 text-[#005f78] bg-[#005f78]/5 dark:border-[#005f78]/40 dark:text-[#4db8d4] dark:bg-[#005f78]/10 text-xs"
                                    >
                                      <ArrowUpRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                      {kw}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    ),
                  )}

                  {/* Competency Mapping */}
                  {sellData.competencyMapping &&
                    sellData.competencyMapping.length > 0 && (
                      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1c2225]">
                        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
                          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-slate-900 dark:text-slate-100">
                            <BadgeCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#005f78] dark:text-[#4db8d4]" />
                            Competency Mapping
                          </CardTitle>
                          <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                            How your skills align with job requirements
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                          <div className="space-y-2 sm:space-y-3">
                            {sellData.competencyMapping.map(
                              (map: CompetencyMapping, i: number) => {
                                const relevance =
                                  relevanceConfig[map.relevance];
                                return (
                                  <div
                                    key={i}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors gap-2 sm:gap-4"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100">
                                        {map.jobRequirement}
                                      </p>
                                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                                        {map.candidateEvidence}
                                      </p>
                                    </div>
                                    <Badge
                                      className={cn(
                                        "shrink-0 w-fit text-xs",
                                        relevance.color,
                                      )}
                                    >
                                      {relevance.label}
                                    </Badge>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                </TabsContent>
              )}

              <TabsContent value="raw" className="mt-0">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-[#1c2225]">
                  <CardHeader className="flex flex-row items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
                    <div>
                      <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">
                        Raw Analysis Data
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Complete JSON output from AI analysis
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs sm:text-sm h-8 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/10"
                    >
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline">Copy JSON</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <ScrollArea className="h-[400px] sm:h-[500px] md:h-[600px] w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950">
                      <pre className="p-3 sm:p-4 text-[10px] sm:text-xs font-mono text-slate-300 leading-relaxed">
                        {JSON.stringify(analysis.analysis, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      <div className="h-48 sm:h-64 bg-slate-200 dark:bg-slate-800 animate-pulse" />
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-7xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-24 sm:h-32 w-full bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
        <Skeleton className="h-48 sm:h-64 w-full bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-64 sm:h-96 w-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function AnalysisNotFound() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#161b1d] px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <FileSearch className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400 dark:text-slate-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Analysis Not Found
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          The analysis you're looking for doesn't exist or you don't have access
          to it.
        </p>
        <Button
          className="mt-4 sm:mt-6 gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white"
          onClick={() => router.push("/cv")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to CVs
        </Button>
      </div>
    </div>
  );
}
