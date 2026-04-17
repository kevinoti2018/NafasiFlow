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

const verdictColors = {
  proceed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  consider: "bg-amber-100 text-amber-800 border-amber-200",
  high_risk: "bg-red-100 text-red-800 border-red-200",
};

export default function AnalysesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [minScore, setMinScore] = useState<string>("any"); // "any" means no filter
  const [verdictFilter, setVerdictFilter] = useState<
    "proceed" | "consider" | "high_risk" | "all"
  >("all");
  const limit = 15;

  const minMatchScore = minScore !== "any" ? parseInt(minScore) : undefined;

  const { data, isLoading } = useAllAnalyses({
    page,
    limit,
    minMatchScore,
    verdict: verdictFilter !== "all" ? verdictFilter : undefined,
  });

  const analyses = data?.analyses || [];
  const pagination = data?.pagination;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Analyses</h1>
          <p className="text-muted-foreground">
            Every CV-Job comparison you've run
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Analyses</CardTitle>
          <CardDescription>Refine by match score or verdict</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <Select value={minScore} onValueChange={setMinScore}>
                <SelectTrigger>
                  <SelectValue placeholder="Min match score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any score</SelectItem>
                  <SelectItem value="80">80%+</SelectItem>
                  <SelectItem value="70">70%+</SelectItem>
                  <SelectItem value="60">60%+</SelectItem>
                  <SelectItem value="50">50%+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Select
                value={verdictFilter}
                onValueChange={(val) => setVerdictFilter(val as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Verdict" />
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
              onClick={() => {
                setMinScore("any");
                setVerdictFilter("all");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            {pagination?.totalCount || 0} total analyses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No analyses found. Try running a CV-Job comparison.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analyses.map((analysis: any) => (
                <div
                  key={analysis.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/analysis/${analysis.id}`)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "font-mono text-sm",
                          verdictColors[
                            analysis.verdict as keyof typeof verdictColors
                          ],
                        )}
                      >
                        {analysis.matchScore}%
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(analysis.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-medium flex items-center gap-1">
                        <Briefcase className="h-3.5 w-3.5" />
                        {analysis.job?.title || "Untitled Job"}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {analysis.cvVersion?.name || "Unnamed CV"}
                      </span>
                    </div>
                    {analysis.application && (
                      <div className="text-xs text-muted-foreground">
                        Linked to application #
                        {analysis.application.id.slice(-6)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 sm:mt-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/my-account/analysis/${analysis.id}`);
                    }}
                  >
                    View Details <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm self-center">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
