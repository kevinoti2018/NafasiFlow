// app/(dashboard)/cv/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Search,
  Upload,
  MoreHorizontal,
  Eye,
  Trash2,
  FileUp,
  ArrowUpRight,
  RotateCcw,
  FolderOpen,
  Sparkles,
  Wand2,
  AlertTriangle,
  LayoutGrid,
  List,
  BarChart3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CVFormModal } from "@/components/cv/cv-form-modal";
import { DeleteCVDialog } from "@/components/cv/delete-cv-dialog";
import { useCVs, useUploadCV, useDeleteCV } from "@/hooks/use-cvs";
import { cn } from "@/lib/utils";
import { CVVersion } from "@prisma/client";

type SourceType = "upload" | "optimized" | "generated";

const sourceConfig: Record<
  SourceType,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: typeof FileUp;
  }
> = {
  upload: {
    label: "Uploaded",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900/50",
    icon: FileUp,
  },
  optimized: {
    label: "Optimized",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900/50",
    icon: Wand2,
  },
  generated: {
    label: "AI Generated",
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-900/50",
    icon: Sparkles,
  },
};

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-1 min-w-[60px]">
        <span className="text-lg font-semibold text-slate-400 dark:text-slate-600">
          —
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-medium">
          {label}
        </span>
      </div>
    );
  }

  const config =
    score >= 80
      ? {
          color: "text-emerald-700 dark:text-emerald-400",
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
          border: "border-emerald-200 dark:border-emerald-900/50",
        }
      : score >= 60
        ? {
            color: "text-amber-700 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/30",
            border: "border-amber-200 dark:border-amber-900/50",
          }
        : {
            color: "text-red-700 dark:text-red-400",
            bg: "bg-red-50 dark:bg-red-950/30",
            border: "border-red-200 dark:border-red-900/50",
          };

  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      <div
        className={cn(
          "h-10 w-10 rounded-lg flex items-center justify-center border-2",
          config.bg,
          config.border,
        )}
      >
        <span className={cn("text-sm font-bold", config.color)}>{score}</span>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-medium">
        {label}
      </span>
    </div>
  );
}

export default function CVPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingCV, setDeletingCV] = useState<CVVersion | null>(null);

  const { data, isLoading } = useCVs();
  const uploadCV = useUploadCV();
  const deleteCV = useDeleteCV();

  const cvs = data?.cvVersions || [];

  // Calculate metrics
  const totalCVs = cvs.length;
  const atsReady = cvs.filter(
    (c: CVVersion) => (c.atsFormatScore || 0) >= 80,
  ).length;
  const optimized = cvs.filter(
    (c: CVVersion) => c.source === "optimized" || c.source === "generated",
  ).length;
  const needsWork = cvs.filter(
    (c: CVVersion) => (c.atsFormatScore || 0) < 60,
  ).length;

  // Filter CVs by search and source
  const filteredCVs = cvs.filter((cv: CVVersion) => {
    const matchesSearch = (cv.name || "Untitled")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesSource = sourceFilter === "all" || cv.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const handleUpload = async (file: File) => {
    await uploadCV.mutateAsync(file);
  };

  const handleDelete = async () => {
    if (!deletingCV) return;
    await deleteCV.mutateAsync(deletingCV.id);
    setDeletingCV(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#161b1d]">
      {/* Header */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-[#161b1d]/95 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-[#005f78] shadow-lg shadow-[#005f78]/25">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Curriculum Vitae
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage your professional profiles and track application
                  readiness
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="default"
                className="gap-2 bg-[#005f78] hover:bg-[#004a5e] text-white"
                onClick={() => setUploadModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Upload CV</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        {!isLoading && cvs.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total CVs
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/15">
                  <FolderOpen className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {totalCVs}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  All documents
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#005f78]/10 rounded-bl-full dark:bg-[#005f78]/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  ATS Ready
                </CardTitle>
                <div className="p-2 rounded-lg bg-[#005f78]/10 dark:bg-[#005f78]/15">
                  <CheckCircle2 className="h-4 w-4 text-[#005f78] dark:text-[#4db8d4]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {atsReady}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Progress
                    value={totalCVs > 0 ? (atsReady / totalCVs) * 100 : 0}
                    className="h-1.5 w-16 bg-slate-200 dark:bg-slate-700"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {totalCVs > 0 ? Math.round((atsReady / totalCVs) * 100) : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-bl-full dark:bg-violet-500/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Optimized
                </CardTitle>
                <div className="p-2 rounded-lg bg-violet-500/10 dark:bg-violet-500/15">
                  <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {optimized}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  AI-enhanced
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 shadow-sm bg-white dark:bg-[#1c2225]">
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full dark:bg-amber-500/10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Needs Work
                </CardTitle>
                <div className="p-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/15">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {needsWork}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Below 60% score
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Card className="border-0 shadow-sm overflow-hidden bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-800">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100">
                  Your Documents
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  {isLoading
                    ? "Loading documents..."
                    : `${filteredCVs.length} document${filteredCVs.length !== 1 ? "s" : ""} found`}
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search documents..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-10 bg-white dark:bg-[#161b1d] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Tabs
                  value={viewMode}
                  onValueChange={(v) => setViewMode(v as "list" | "grid")}
                >
                  <TabsList className="h-10 bg-slate-100 dark:bg-[#161b1d]">
                    <TabsTrigger
                      value="list"
                      className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#005f78] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#005f78] dark:data-[state=active]:text-white"
                    >
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline">List</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="grid"
                      className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#005f78] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#005f78] dark:data-[state=active]:text-white"
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="hidden sm:inline">Grid</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button
                variant={sourceFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("all")}
                className={cn(
                  "h-8",
                  sourceFilter === "all"
                    ? "bg-[#005f78] hover:bg-[#004a5e] text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-[#005f78] hover:border-[#005f78]/50 dark:hover:text-slate-200",
                )}
              >
                All
              </Button>
              <Button
                variant={sourceFilter === "upload" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("upload")}
                className={cn(
                  "h-8",
                  sourceFilter === "upload"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:border-blue-500/50",
                )}
              >
                <FileUp className="h-3.5 w-3.5 mr-1.5" />
                Uploaded
              </Button>
              <Button
                variant={sourceFilter === "optimized" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("optimized")}
                className={cn(
                  "h-8",
                  sourceFilter === "optimized"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 hover:border-emerald-500/50",
                )}
              >
                <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                Optimized
              </Button>
              <Button
                variant={sourceFilter === "generated" ? "default" : "outline"}
                size="sm"
                onClick={() => setSourceFilter("generated")}
                className={cn(
                  "h-8",
                  sourceFilter === "generated"
                    ? "bg-violet-600 hover:bg-violet-700 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-violet-600 hover:border-violet-500/50",
                )}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                AI Generated
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-16 w-full bg-slate-200 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : viewMode === "list" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-100 dark:border-slate-800">
                      <TableHead className="w-[300px] text-slate-500 dark:text-slate-400">
                        Document
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        Source
                      </TableHead>
                      <TableHead className="hidden md:table-cell text-slate-500 dark:text-slate-400">
                        Format Score
                      </TableHead>
                      <TableHead className="hidden md:table-cell text-slate-500 dark:text-slate-400">
                        Content Score
                      </TableHead>
                      <TableHead className="hidden sm:table-cell text-slate-500 dark:text-slate-400">
                        Created
                      </TableHead>
                      <TableHead className="text-right text-slate-500 dark:text-slate-400">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCVs.map((cv: CVVersion) => {
                      const sourceKey = (cv.source as SourceType) || "upload";
                      const source =
                        sourceConfig[sourceKey] || sourceConfig.upload;
                      const SourceIcon = source.icon;

                      return (
                        <TableRow
                          key={cv.id}
                          onClick={() => router.push(`/my-account/cv/${cv.id}`)}
                          className="cursor-pointer group border-slate-100 dark:border-slate-800 hover:bg-[#005f78]/5 dark:hover:bg-[#005f78]/5"
                        >
                          <TableCell>
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border-2",
                                  source.bg,
                                  source.border,
                                )}
                              >
                                <SourceIcon
                                  className={cn("h-5 w-5", source.color)}
                                />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-100">
                                  {cv.name || "Untitled CV"}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-500">
                                  {source.label}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1.5 border-0 bg-transparent p-0",
                                source.color,
                              )}
                            >
                              <SourceIcon className="h-3 w-3" />
                              {source.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              {cv.atsFormatScore !== null ? (
                                <>
                                  <div
                                    className={cn(
                                      "h-8 w-8 rounded-lg flex items-center justify-center border-2",
                                      (cv.atsFormatScore || 0) >= 80
                                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                                        : (cv.atsFormatScore || 0) >= 60
                                          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"
                                          : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "text-xs font-bold",
                                        (cv.atsFormatScore || 0) >= 80
                                          ? "text-emerald-700 dark:text-emerald-400"
                                          : (cv.atsFormatScore || 0) >= 60
                                            ? "text-amber-700 dark:text-amber-400"
                                            : "text-red-700 dark:text-red-400",
                                      )}
                                    >
                                      {cv.atsFormatScore}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    %
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  —
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              {cv.atsContentScore !== null ? (
                                <>
                                  <div
                                    className={cn(
                                      "h-8 w-8 rounded-lg flex items-center justify-center border-2",
                                      (cv.atsContentScore || 0) >= 80
                                        ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50"
                                        : (cv.atsContentScore || 0) >= 60
                                          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50"
                                          : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/50",
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "text-xs font-bold",
                                        (cv.atsContentScore || 0) >= 80
                                          ? "text-emerald-700 dark:text-emerald-400"
                                          : (cv.atsContentScore || 0) >= 60
                                            ? "text-amber-700 dark:text-amber-400"
                                            : "text-red-700 dark:text-red-400",
                                      )}
                                    >
                                      {cv.atsContentScore}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500">
                                    %
                                  </span>
                                </>
                              ) : (
                                <span className="text-sm text-slate-400">
                                  —
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-slate-500 dark:text-slate-500">
                            {formatDistanceToNow(new Date(cv.createdAt), {
                              addSuffix: true,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div
                              className="flex items-center justify-end gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-[#005f78] hover:text-[#005f78] hover:bg-[#005f78]/10 dark:hover:text-[#4db8d4] dark:hover:bg-[#005f78]/10"
                                onClick={() =>
                                  router.push(`/my-account/cv/${cv.id}`)
                                }
                              >
                                <span className="hidden sm:inline mr-1 text-xs">
                                  View
                                </span>
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-white dark:bg-[#1c2225] border-slate-200 dark:border-slate-700"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(`/my-account/cv/${cv.id}`)
                                    }
                                    className="text-slate-700 dark:text-slate-300 focus:bg-[#005f78]/10 focus:text-[#005f78] dark:focus:bg-[#005f78]/20 dark:focus:text-[#4db8d4]"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
                                  <DropdownMenuItem
                                    onClick={() => setDeletingCV(cv)}
                                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredCVs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-500">
                            <Search className="h-8 w-8 mb-2 opacity-50" />
                            <p>No documents found</p>
                            <p className="text-sm">
                              {search || sourceFilter !== "all"
                                ? "Try adjusting your search or filters"
                                : "Upload your first CV to get started"}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredCVs.map((cv: CVVersion) => {
                    const sourceKey = (cv.source as SourceType) || "upload";
                    const source =
                      sourceConfig[sourceKey] || sourceConfig.upload;
                    const SourceIcon = source.icon;

                    return (
                      <Card
                        key={cv.id}
                        className="group cursor-pointer border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-[#161b1d] hover:border-[#005f78]/30 dark:hover:border-[#005f78]/30"
                        onClick={() => router.push(`/my-account/cv/${cv.id}`)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center border-2",
                                source.bg,
                                source.border,
                              )}
                            >
                              <SourceIcon
                                className={cn("h-6 w-6", source.color)}
                              />
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1.5 border-0 bg-transparent",
                                source.color,
                              )}
                            >
                              <SourceIcon className="h-3 w-3" />
                              {source.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg mt-3 line-clamp-1 text-slate-900 dark:text-slate-100">
                            {cv.name || "Untitled CV"}
                          </CardTitle>
                          <CardDescription className="line-clamp-1 text-slate-500 dark:text-slate-500">
                            {formatDistanceToNow(new Date(cv.createdAt), {
                              addSuffix: true,
                            })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <ScoreBadge
                                score={cv.atsFormatScore}
                                label="Format"
                              />
                              <ScoreBadge
                                score={cv.atsContentScore}
                                label="Content"
                              />
                            </div>
                          </div>
                        </CardContent>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 shadow-lg bg-[#005f78] hover:bg-[#004a5e] text-white border-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/my-account/cv/${cv.id}`);
                            }}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {filteredCVs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-500">
                    <Search className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No documents found</p>
                    <p className="text-sm">
                      {search || sourceFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "Upload your first CV to get started"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CVFormModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUpload={handleUpload}
        isUploading={uploadCV.isPending}
      />

      <DeleteCVDialog
        open={!!deletingCV}
        onOpenChange={() => setDeletingCV(null)}
        cvName={deletingCV?.name ?? undefined}
        onConfirm={handleDelete}
        isDeleting={deleteCV.isPending}
      />
    </div>
  );
}
