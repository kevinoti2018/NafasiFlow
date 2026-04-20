// app/(dashboard)/my-account/page.tsx
"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  Briefcase,
  ClipboardList,
  BarChart3,
  TrendingUp,
  Clock,
  Eye,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
};

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useDashboardStats();

  if (isLoading) return <DashboardSkeleton />;

  const stats = data;

  const recentAnalyses = stats?.recent?.analyses || [];
  const recentApplications = stats?.recent?.applications || [];
  const topCVs = stats?.topCVs || [];

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your job application ecosystem
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total CVs
            </CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals?.cvs || 0}</div>
            <p className="text-xs text-muted-foreground">Uploaded documents</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Jobs
            </CardTitle>
            <Briefcase className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals?.jobs || 0}</div>
            <p className="text-xs text-muted-foreground">Tracked positions</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Applications
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totals?.applications || 0}
            </div>
            <p className="text-xs text-muted-foreground">Sent or saved</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Match Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averages?.matchScore || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all analyses</p>
          </CardContent>
        </Card>
      </div>

      {/* Top CVs Section */}
      {topCVs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing CVs</CardTitle>
            <CardDescription>Highest ATS format scores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCVs.map((cv: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{cv.name || "Unnamed CV"}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Format: {cv.atsFormatScore}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Content: {cv.atsContentScore}%
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/my-account/cv/${cv.id}`)}
                  >
                    View <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity – Two Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Analyses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Recent CV-Job Analyses
            </CardTitle>
            <CardDescription>Latest match evaluations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No analyses yet. Run a CV-Job comparison.
              </p>
            ) : (
              <div className="space-y-3">
                {recentAnalyses.map((analysis: any) => (
                  <div
                    key={analysis.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/analysis/${analysis.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {analysis.job?.title || "Untitled"} at{" "}
                        {analysis.job?.company || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {analysis.cvVersion?.name || "CV"} •{" "}
                        {analysis.matchScore}% match
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(analysis.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Recent Applications
            </CardTitle>
            <CardDescription>
              Latest submissions and status updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No applications yet. Apply from a job detail page.
              </p>
            ) : (
              <div className="space-y-3">
                {recentApplications.map((app: any) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/my-account/applications/${app.id}`)
                    }
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {app.job?.title || "Untitled"} at{" "}
                        {app.job?.company || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {app.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {app.cvVersion?.name || "CV"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(app.createdAt), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Button
          variant="outline"
          className="h-auto py-4 flex items-center justify-between"
          onClick={() => router.push("/my-account/cv")}
        >
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            <div className="text-left">
              <p className="font-medium">Manage CVs</p>
              <p className="text-xs text-muted-foreground">
                Upload, edit, or optimize your documents
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex items-center justify-between"
          onClick={() => router.push("/my-account/jobs")}
        >
          <div className="flex items-center gap-3">
            <Briefcase className="h-5 w-5" />
            <div className="text-left">
              <p className="font-medium">Manage Jobs</p>
              <p className="text-xs text-muted-foreground">
                Track positions and analyze CV matches
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Skeleton Loader
function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}
