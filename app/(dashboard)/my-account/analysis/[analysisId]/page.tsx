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
  ChevronDown,
  ChevronUp,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAnalysis } from "@/hooks/use-analysis";
import { cn } from "@/lib/utils";

const verdictConfig = {
  proceed: {
    label: "Strong Match",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: CheckCircle2,
  },
  consider: {
    label: "Moderate Fit",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: Target,
  },
  high_risk: {
    label: "Low Compatibility",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertCircle,
  },
};

export default function AnalysisDetailPage() {
  const { analysisId } = useParams();
  const router = useRouter();
  const { data, isLoading, error } = useAnalysis(analysisId as string);

  if (isLoading) return <AnalysisSkeleton />;
  if (error || !data?.analysis) return <AnalysisNotFound />;

  const analysis = data.analysis;
  const matchData = analysis.analysis?.match || analysis.analysis;
  const sellData = analysis.analysis?.sell;

  const verdict = matchData?.verdict || "consider";
  const verdictInfo =
    verdictConfig[verdict as keyof typeof verdictConfig] ||
    verdictConfig.consider;
  const VerdictIcon = verdictInfo.icon;

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Analysis Details
          </h1>
          <p className="text-sm text-muted-foreground">
            {analysis.cvVersion?.id && (
              <>
                CV:{" "}
                <span className="font-medium">
                  {analysis.cvVersion.id.slice(-8)}
                </span>
              </>
            )}
            {analysis.job?.title && (
              <>
                {" "}
                • Job: <span className="font-medium">{analysis.job.title}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Match Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysis.matchScore}%</div>
            <Badge className={cn("mt-2 gap-1", verdictInfo.color)}>
              <VerdictIcon className="h-3 w-3" />
              {verdictInfo.label}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchData?.confidence || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              AI confidence in score
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seniority Gap</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchData?.eligibility?.seniorityGap === -1
                ? "Underqualified"
                : matchData?.eligibility?.seniorityGap === 1
                  ? "Overqualified"
                  : "Match"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Remote Compatible
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchData?.eligibility?.isRemoteCompatible === true
                ? "Yes"
                : matchData?.eligibility?.isRemoteCompatible === false
                  ? "No"
                  : "Unknown"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown */}
      {matchData?.scoreBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(matchData.scoreBreakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{key}</span>
                    <span>{value as number}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed AI output */}
      <Tabs defaultValue="match" className="space-y-4">
        <TabsList>
          <TabsTrigger value="match">Match Analysis</TabsTrigger>
          {sellData && (
            <TabsTrigger value="sell">Sell Recommendations</TabsTrigger>
          )}
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="match" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rationale</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {matchData?.rationale || "No rationale provided."}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Critical Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              {matchData?.criticalGaps?.length ? (
                <ul className="space-y-2">
                  {matchData.criticalGaps.map((gap: any, i: number) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-medium">• {gap.gap}:</span>
                      <span className="text-muted-foreground">{gap.fix}</span>
                      <Badge variant="outline" className="ml-auto">
                        {gap.impact}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  No critical gaps identified.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {matchData?.recommendations?.length ? (
                <ul className="list-disc list-inside space-y-1">
                  {matchData.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="text-muted-foreground">
                      {rec}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  No specific recommendations.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {sellData && (
          <TabsContent value="sell" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Positioning</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Angle:</strong> {sellData.positioning?.angle}
                </p>
                <p className="mt-2 text-muted-foreground">
                  {sellData.positioning?.rationale}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sellData.positioning?.keyThemes?.map((theme: string) => (
                    <Badge key={theme} variant="secondary">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Optimized Headline & Pitch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-semibold">Original</h4>
                  <p className="text-muted-foreground">
                    {sellData.profileOptimization?.originalHeadline}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Optimized</h4>
                  <p className="text-primary font-medium">
                    {sellData.profileOptimization?.optimizedHeadline}
                  </p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold">Elevator Pitch</h4>
                  <p className="text-muted-foreground">
                    {sellData.profileOptimization?.elevatorPitch}
                  </p>
                </div>
              </CardContent>
            </Card>
            {sellData.experienceTransformations?.map(
              (exp: any, idx: number) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle>{exp.role}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Original Bullets</h4>
                      <ul className="list-disc list-inside text-muted-foreground">
                        {exp.originalBullets?.map((b: string, i: number) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold">Optimized Bullets</h4>
                      <ul className="list-disc list-inside text-primary">
                        {exp.optimizedBullets?.map((b: string, i: number) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-sm text-muted-foreground">
                        Injected keywords:
                      </span>
                      {exp.injectedKeywords?.map((kw: string) => (
                        <Badge key={kw} variant="outline">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ),
            )}
            {sellData.competencyMapping?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Competency Mapping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sellData.competencyMapping.map((map: any, i: number) => (
                    <div key={i} className="flex justify-between border-b pb-2">
                      <span className="font-medium">{map.jobRequirement}</span>
                      <span className="text-muted-foreground text-sm">
                        {map.candidateEvidence}
                      </span>
                      <Badge variant="outline">{map.relevance}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Complete AI Output (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <pre className="text-xs font-mono">
                  {JSON.stringify(analysis.analysis, null, 2)}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalysisSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function AnalysisNotFound() {
  const router = useRouter();
  return (
    <div className="container mx-auto py-12 text-center">
      <h2 className="text-2xl font-bold">Analysis not found</h2>
      <p className="text-muted-foreground">
        The analysis you're looking for doesn't exist or you don't have access.
      </p>
      <Button className="mt-4" onClick={() => router.push("/cv")}>
        Back to CVs
      </Button>
    </div>
  );
}
