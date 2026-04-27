"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  BarChart3,
  Briefcase,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAllAnalyses } from "@/hooks/use-analysis";

type VerdictType = "proceed" | "consider" | "high_risk";

// Define the shape of an analysis item returned by the API
interface AnalysisItem {
  id: string;
  matchScore: number;
  verdict: VerdictType;
  createdAt: string;
  job: {
    title: string | null;
    company: string | null;
  } | null;
  cvVersion: {
    name: string | null;
  } | null;
  application: {
    id: string;
    status: string;
  } | null;
}

const verdictConfig: Record<
  VerdictType | "all",
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof CheckCircle2;
  }
> = {
  proceed: {
    label: "Strong Match",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900/50",
    icon: CheckCircle2,
  },
  consider: {
    label: "Moderate Fit",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900/50",
    icon: AlertTriangle,
  },
  high_risk: {
    label: "Low Compatibility",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900/50",
    icon: XCircle,
  },
  all: {
    label: "All Verdicts",
    color: "text-muted-foreground",
    bg: "bg-transparent",
    border: "border-transparent",
    icon: Filter,
  },
};

export default function AnalysesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [minScore, setMinScore] = useState<string>("any");
  const [verdictFilter, setVerdictFilter] = useState<VerdictType | "all">(
    "all",
  );
  const limit = 15;

  const minMatchScore = minScore !== "any" ? parseInt(minScore) : undefined;

  const { data, isLoading } = useAllAnalyses({
    page,
    limit,
    minMatchScore,
    verdict: verdictFilter !== "all" ? verdictFilter : undefined,
  });

  const analyses = (data?.analyses as AnalysisItem[]) || [];
  const pagination = data?.pagination;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setMinScore("any");
    setVerdictFilter("all");
    setPage(1);
  };

  const hasActiveFilters = minScore !== "any" || verdictFilter !== "all";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#161b1d] py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#005f78]/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#005f78]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  All Analyses
                </h1>
                <p className="text-sm text-muted-foreground">
                  Every CV-Job comparison you&lsquo;ve run
                </p>
              </div>
            </div>
          </div>
          {pagination && (
            <Badge variant="secondary" className="h-8 px-3 text-sm font-medium">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
              {pagination.totalCount} total
            </Badge>
          )}
        </div>

        {/* Filters */}
        <Card className="border shadow-sm dark:border-neutral-800">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 min-w-[140px] space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Minimum Score
                </label>
                <Select value={minScore} onValueChange={setMinScore}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Any score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any score</SelectItem>
                    <SelectItem value="80">80% and above</SelectItem>
                    <SelectItem value="70">70% and above</SelectItem>
                    <SelectItem value="60">60% and above</SelectItem>
                    <SelectItem value="50">50% and above</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[140px] space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Verdict
                </label>
                <Select
                  value={verdictFilter}
                  onValueChange={(val) =>
                    setVerdictFilter(val as VerdictType | "all")
                  }
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All verdicts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All verdicts</SelectItem>
                    <SelectItem value="proceed">Strong Match</SelectItem>
                    <SelectItem value="consider">Moderate Fit</SelectItem>
                    <SelectItem value="high_risk">Low Compatibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className={cn(
                  "h-10 px-4 transition-opacity",
                  !hasActiveFilters && "opacity-50 cursor-not-allowed",
                )}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {minScore !== "any" && (
                  <Badge variant="secondary" className="h-7 px-2.5 gap-1">
                    Score: {minScore}%+
                    <button
                      onClick={() => setMinScore("any")}
                      className="ml-1 hover:text-foreground"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {verdictFilter !== "all" && (
                  <Badge variant="secondary" className="h-7 px-2.5 gap-1">
                    {verdictConfig[verdictFilter].label}
                    <button
                      onClick={() => setVerdictFilter("all")}
                      className="ml-1 hover:text-foreground"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="border shadow-sm dark:border-neutral-800">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Results
                </CardTitle>
                <CardDescription>
                  {isLoading
                    ? "Loading analyses..."
                    : `${analyses.length} result${analyses.length !== 1 ? "s" : ""} on page ${page}`}
                </CardDescription>
              </div>
              {hasActiveFilters && (
                <div className="h-8 w-8 rounded-full bg-[#005f78]/10 flex items-center justify-center">
                  <Filter className="h-4 w-4 text-[#005f78]" />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border">
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : analyses.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  No analyses found
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  {hasActiveFilters
                    ? "Try adjusting your filters to see more results."
                    : "Run a CV-Job comparison to start building your analysis history."}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {analyses.map((analysis) => {
                  const verdict = analysis.verdict;
                  const config = verdictConfig[verdict];
                  const VerdictIcon = config.icon;

                  return (
                    <div
                      key={analysis.id}
                      className="group relative flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-[#005f78]/30 hover:shadow-sm hover:bg-accent/30 transition-all cursor-pointer"
                      onClick={() =>
                        router.push(`/my-account/analysis/${analysis.id}`)
                      }
                    >
                      {/* Score & Verdict */}
                      <div className="flex items-center gap-3 sm:w-48 shrink-0">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-xl flex flex-col items-center justify-center border-2",
                            config.bg,
                            config.border,
                          )}
                        >
                          <span
                            className={cn(
                              "text-lg font-bold leading-none",
                              config.color,
                            )}
                          >
                            {analysis.matchScore}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                            %
                          </span>
                        </div>
                        <div className="sm:hidden">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-medium border-0 bg-transparent p-0",
                              config.color,
                            )}
                          >
                            <VerdictIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {analysis.job?.title || "Untitled Job"}
                          </span>
                          <span className="text-muted-foreground text-xs hidden sm:inline">
                            •
                          </span>
                          <span className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            {analysis.cvVersion?.name || "Unnamed CV"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(analysis.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          {analysis.application && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                App #{analysis.application.id.slice(-6)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Verdict Badge (desktop) + Action */}
                      <div className="flex items-center gap-3 sm:w-auto shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            "hidden sm:inline-flex text-xs font-medium border-0 bg-transparent",
                            config.color,
                          )}
                        >
                          <VerdictIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-[#005f78] hover:text-[#005f78] hover:bg-[#005f78]/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/my-account/analysis/${analysis.id}`);
                          }}
                        >
                          <span className="hidden sm:inline mr-1">View</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * limit + 1} -{" "}
                  {Math.min(page * limit, pagination.totalCount)} of{" "}
                  {pagination.totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="h-8 px-3"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        const pageNum = i + 1;
                        const isActive = pageNum === page;
                        return (
                          <Button
                            key={pageNum}
                            variant={isActive ? "default" : "ghost"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={cn(
                              "h-8 w-8 p-0 text-xs",
                              isActive &&
                                "bg-[#005f78] hover:bg-[#005f78]/90 text-white",
                            )}
                          >
                            {pageNum}
                          </Button>
                        );
                      },
                    )}
                    {pagination.totalPages > 5 && (
                      <span className="text-xs text-muted-foreground px-1">
                        ...
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="h-8 px-3"
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
