"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  Briefcase,
  ClipboardList,
  BarChart3,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Target,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  Building2,
  Calendar,
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

// Types based on API response
interface TopCV {
  id: string;
  name: string | null;
  atsFormatScore: number | null;
  atsContentScore: number | null;
}

interface RecentAnalysis {
  id: string;
  matchScore: number;
  createdAt: string;
  job: { title: string | null; company: string | null };
  cvVersion: { name: string | null };
}

interface RecentApplication {
  id: string;
  status: string;
  createdAt: string;
  job: { title: string | null; company: string | null };
  cvVersion: { name: string | null };
}

const STATUS_STYLES: Record<string, string> = {
  saved:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  applied:
    "bg-[#005f78]/10 text-[#005f78] border-[#005f78]/20 dark:bg-[#005f78]/20 dark:text-[#4db8d4] dark:border-[#005f78]/30",
  interviewing:
    "bg-[#005f78]/15 text-[#005f78] border-[#005f78]/25 dark:bg-[#005f78]/25 dark:text-[#4db8d4] dark:border-[#005f78]/40",
  offered:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
};

const getScoreColor = (score: number | null | undefined): string => {
  const s = score ?? 0;
  return s >= 80 ? "#005f78" : s >= 60 ? "#f59e0b" : "#f43f5e";
};

export default function DashboardPage() {
  const router = useRouter();
  const { data, isLoading } = useDashboardStats();

  if (isLoading) return <DashboardSkeleton />;

  const stats = data;
  const recentAnalyses = (stats?.recent?.analyses as RecentAnalysis[]) || [];
  const recentApplications =
    (stats?.recent?.applications as RecentApplication[]) || [];
  const topCVs = (stats?.topCVs as TopCV[]) || [];

  const kpis = [
    {
      label: "Total CVs",
      value: stats?.totals?.cvs || 0,
      sub: "Uploaded documents",
      icon: FileText,
      href: "/my-account/cv",
    },
    {
      label: "Jobs Tracked",
      value: stats?.totals?.jobs || 0,
      sub: "Saved positions",
      icon: Briefcase,
      href: "/my-account/jobs",
    },
    {
      label: "Applications",
      value: stats?.totals?.applications || 0,
      sub: "Sent or saved",
      icon: ClipboardList,
      href: "/my-account/applications",
    },
    {
      label: "Avg. Match",
      value: `${stats?.averages?.matchScore || 0}%`,
      sub: "Across all analyses",
      icon: TrendingUp,
      href: "/my-account/analysis",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#161b1d]/95 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#005f78] shadow-lg shadow-[#005f78]/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your job application ecosystem at a glance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(({ label, value, sub, icon: Icon, href }) => (
            <Card
              key={label}
              className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225] cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
              onClick={() => router.push(href)}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {label}
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/15">
                  <Icon className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {value}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  {sub}
                </p>
              </CardContent>
              <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-[#005f78] opacity-0 group-hover:opacity-60 transition-opacity" />
            </Card>
          ))}
        </div>

        {/* Top CVs */}
        {topCVs.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#005f78]/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-[#005f78]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Top Performing CVs
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Highest ATS format scores
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topCVs.map((cv, idx) => (
                <Card
                  key={idx}
                  className="group cursor-pointer border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-[#161b1d] hover:border-[#005f78]/30 dark:hover:border-[#005f78]/30"
                  onClick={() => router.push(`/my-account/cv/${cv.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-xl bg-[#005f78]/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[#005f78]" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardTitle className="text-base mt-2 line-clamp-1 text-slate-900 dark:text-slate-100">
                      {cv.name || "Unnamed CV"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <ScoreBar label="Format" value={cv.atsFormatScore ?? 0} />
                    <ScoreBar label="Content" value={cv.atsContentScore ?? 0} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Analyses */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#005f78]/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#005f78]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Recent Analyses
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest CV-job match evaluations
                </p>
              </div>
            </div>
            <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-800">
              <CardContent className="p-0">
                {recentAnalyses.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <Search className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      No analyses yet — run a CV-job comparison to get started.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentAnalyses.map((a) => {
                      const score = a.matchScore || 0;
                      return (
                        <li key={a.id}>
                          <button
                            onClick={() =>
                              router.push(`/my-account/analysis/${a.id}`)
                            }
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/5 transition-colors group"
                          >
                            <div
                              className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border-2",
                                score >= 80
                                  ? "bg-[#005f78]/10 border-[#005f78]/20 dark:bg-[#005f78]/20 dark:border-[#005f78]/30"
                                  : score >= 60
                                    ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"
                                    : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
                              )}
                            >
                              <span
                                className={cn(
                                  "text-xs font-bold",
                                  score >= 80
                                    ? "text-[#005f78] dark:text-[#4db8d4]"
                                    : score >= 60
                                      ? "text-amber-700 dark:text-amber-400"
                                      : "text-red-700 dark:text-red-400",
                                )}
                              >
                                {score}%
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {a.job?.title || "Untitled"}{" "}
                                <span className="text-slate-400 font-normal">
                                  at
                                </span>{" "}
                                {a.job?.company || "Unknown"}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {a.cvVersion?.name || "CV"}
                              </p>
                            </div>
                            <span className="text-xs text-slate-400 shrink-0">
                              {formatDistanceToNow(new Date(a.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                            <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Recent Applications */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#005f78]/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-[#005f78]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Recent Applications
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest submissions and status updates
                </p>
              </div>
            </div>
            <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-800">
              <CardContent className="p-0">
                {recentApplications.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      No applications yet — apply from a job detail page.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                    {recentApplications.map((app) => (
                      <li key={app.id}>
                        <button
                          onClick={() =>
                            router.push(`/my-account/applications/${app.id}`)
                          }
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/5 transition-colors group"
                        >
                          <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {app.job?.title || "Untitled"}{" "}
                              <span className="text-slate-400 font-normal">
                                at
                              </span>{" "}
                              {app.job?.company || "Unknown"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] font-medium border-0 bg-transparent p-0",
                                  STATUS_STYLES[app.status] ||
                                    STATUS_STYLES.saved,
                                )}
                              >
                                {app.status}
                              </Badge>
                              <span className="text-xs text-slate-400 truncate">
                                {app.cvVersion?.name || "CV"}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">
                            {formatDistanceToNow(new Date(app.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Quick Actions */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-[#005f78]/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-[#005f78]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Quick Actions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Jump to common tasks
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                href: "/my-account/cv",
                icon: FileText,
                title: "Manage CVs",
                sub: "Upload, edit, or optimize your documents",
              },
              {
                href: "/my-account/jobs",
                icon: Briefcase,
                title: "Manage Jobs",
                sub: "Track positions and analyze CV matches",
              },
            ].map(({ href, icon: Icon, title, sub }) => (
              <Card
                key={href}
                className="group cursor-pointer border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-[#161b1d] hover:border-[#005f78]/30 dark:hover:border-[#005f78]/30"
                onClick={() => router.push(href)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-[#005f78]/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-[#005f78]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {sub}
                        </p>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-[#005f78]/10 flex items-center justify-center shrink-0 transition-all group-hover:scale-110">
                      <ArrowRight className="h-4 w-4 text-[#005f78]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = getScoreColor(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="text-xs font-semibold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-64 bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-32 rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-72 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
