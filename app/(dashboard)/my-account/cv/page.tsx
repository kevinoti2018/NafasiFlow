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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CVFormModal } from "@/components/cv/cv-form-modal";
import { DeleteCVDialog } from "@/components/cv/delete-cv-dialog";
import { useCVs, useUploadCV, useDeleteCV } from "@/hooks/use-cvs";
import { cn } from "@/lib/utils";
import { CVVersion } from "@prisma/client";

const sourceConfig = {
  upload: {
    label: "Uploaded",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: FileUp,
  },
  optimized: {
    label: "Optimized",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: FileText,
  },
  generated: {
    label: "AI Generated",
    color: "bg-violet-50 text-violet-700 border-violet-200",
    icon: FileText,
  },
};

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null)
    return <span className="text-muted-foreground text-sm">—</span>;

  const colorClass =
    score >= 80
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : score >= 60
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="flex flex-col gap-1">
      <Badge variant="outline" className={cn("font-medium", colorClass)}>
        {score}%
      </Badge>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default function CVPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingCV, setDeletingCV] = useState<CVVersion | null>(null);

  const { data, isLoading } = useCVs();
  const uploadCV = useUploadCV();
  const deleteCV = useDeleteCV();

  const cvs = data?.cvVersions || [];

  const filteredCVs = cvs.filter((cv: CVVersion) =>
    (cv.name || "Untitled").toLowerCase().includes(search.toLowerCase()),
  );

  const handleUpload = async (file: File) => {
    await uploadCV.mutateAsync(file);
  };

  const handleDelete = async () => {
    if (!deletingCV) return;
    await deleteCV.mutateAsync(deletingCV.id);
    setDeletingCV(null);
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Curriculum Vitae
          </h1>
          <p className="text-muted-foreground">
            Manage your professional profiles and track application readiness
          </p>
        </div>
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Upload CV
        </Button>
      </div>

      {/* Stats Overview */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50/50 to-transparent border-blue-100">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-700">
                {cvs.length}
              </div>
              <p className="text-xs text-blue-600/80 font-medium uppercase tracking-wide">
                Total CVs
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50/50 to-transparent border-emerald-100">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-700">
                {
                  cvs.filter((c: CVVersion) => (c.atsFormatScore || 0) >= 80)
                    .length
                }
              </div>
              <p className="text-xs text-emerald-600/80 font-medium uppercase tracking-wide">
                ATS Ready
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-50/50 to-transparent border-violet-100">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-violet-700">
                {
                  cvs.filter(
                    (c: CVVersion) =>
                      c.source === "optimized" || c.source === "generated",
                  ).length
                }
              </div>
              <p className="text-xs text-violet-600/80 font-medium uppercase tracking-wide">
                Optimized
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50/50 to-transparent border-amber-100">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-700">
                {
                  cvs.filter((c: CVVersion) => (c.atsFormatScore || 0) < 60)
                    .length
                }
              </div>
              <p className="text-xs text-amber-600/80 font-medium uppercase tracking-wide">
                Needs Work
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold">
                Your Documents
              </CardTitle>
              <CardDescription>
                {filteredCVs.length} document
                {filteredCVs.length !== 1 ? "s" : ""} available
              </CardDescription>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 border rounded-lg"
                >
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCVs.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">No documents found</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  {search
                    ? "No documents match your search criteria"
                    : "Upload your first CV to start tracking job applications and get AI-powered optimization suggestions"}
                </p>
              </div>
              {!search && (
                <Button
                  onClick={() => setUploadModalOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Your First CV
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCVs.map((cv: CVVersion) => {
                const source =
                  sourceConfig[cv.source as keyof typeof sourceConfig] ||
                  sourceConfig.upload;
                const SourceIcon = source.icon;

                return (
                  <div
                    key={cv.id}
                    onClick={() => router.push(`/my-account/cv/${cv.id}`)}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-md hover:bg-muted/20 transition-all duration-200 cursor-pointer"
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                        source.color
                          .replace("text-", "bg-")
                          .replace("700", "100")
                          .replace("border-", ""),
                      )}
                    >
                      <SourceIcon
                        className={cn("h-5 w-5", source.color.split(" ")[1])}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {cv.name ||
                          `CV from ${formatDistanceToNow(new Date(cv.createdAt))}`}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-medium", source.color)}
                        >
                          {source.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(cv.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Scores - Desktop */}
                    <div className="hidden md:flex items-center gap-6">
                      <ScoreBadge score={cv.atsFormatScore} label="Format" />
                      <ScoreBadge score={cv.atsContentScore} label="Content" />
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => router.push(`/cv/${cv.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/cv/${cv.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingCV(cv)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
