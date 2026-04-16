// app/(dashboard)/cv/[cvId]/optimize/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Sparkles,
  Target,
  Zap,
  Briefcase,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lightbulb,
  Wand2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useCV, useOptimizeCV } from "@/hooks/use-cvs";
import { useJobs } from "@/hooks/use-jobs";
import { cn } from "@/lib/utils";

const optimizationTypes = {
  general: {
    id: "general",
    title: "General ATS Enhancement",
    description:
      "Improve overall compatibility with applicant tracking systems",
    icon: Zap,
    benefits: [
      "Enhanced keyword density",
      "Improved action verbs",
      "Better formatting structure",
      "Stronger achievement metrics",
    ],
    color: "blue",
    estimatedTime: "~20 seconds",
  },
  job: {
    id: "job",
    title: "Job-Specific Tailoring",
    description: "Customize your CV for a specific position",
    icon: Target,
    benefits: [
      "Keyword alignment with job description",
      "Tailored professional summary",
      "Relevant experience highlighting",
      "Skills matching & prioritization",
    ],
    color: "amber",
    estimatedTime: "~30 seconds",
  },
};
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Job } from "@prisma/client";

export default function CVOptimizePage() {
  const { id } = useParams();
  const router = useRouter();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [optimizationType, setOptimizationType] = useState<"general" | "job">(
    "general",
  );

  const { data: cvData, isLoading: cvLoading } = useCV(id as string);
  const { data: jobsData, isLoading: jobsLoading } = useJobs({ limit: 100 });
  const optimizeMutation = useOptimizeCV();

  const cv = cvData?.cvVersion;
  const jobs = jobsData?.jobs || [];

  const handleOptimize = async () => {
    if (!cv) return;
    if (optimizationType === "job" && !selectedJobId) return;

    await optimizeMutation.mutateAsync({
      cvId: cv.id,
      jobId: optimizationType === "job" ? selectedJobId : undefined,
      type: optimizationType,
    });

    router.push(`/my-account/cv/${cv.id}`);
  };

  const selectedType = optimizationTypes[optimizationType];
  const TypeIcon = selectedType.icon;

  if (cvLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">CV Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The document you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push("/my-account/cv")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  const displayName =
    cv.name || `CV from ${formatDistanceToNow(new Date(cv.createdAt))}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-4 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-4xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Optimize CV</CardTitle>
          <CardDescription>
            Generate an improved version of `&quot;`
            {cv.name ||
              `CV from ${new Date(cv.createdAt).toLocaleDateString()}`}
            `&quot;`. Choose general ATS optimization or tailor it to a specific
            job.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CV info (read‑only) */}
          <div className="space-y-1">
            <Label>CV being optimized</Label>
            <div className="p-3 border rounded-md bg-muted/50">
              <p className="font-medium">
                {cv.name ||
                  `CV from ${new Date(cv.createdAt).toLocaleDateString()}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Uploaded {new Date(cv.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Optimization type */}
          <div className="space-y-2">
            <Label>Optimization type</Label>
            <RadioGroup
              value={optimizationType}
              onValueChange={(val) =>
                setOptimizationType(val as "general" | "job")
              }
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="general" id="general" />
                <Label htmlFor="general">
                  General ATS Improvement (content & format)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="job" id="job" />
                <Label htmlFor="job">
                  Job‑Tailored (rewrite for a specific job)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Job selection (only if job-tailored) */}
          {optimizationType === "job" && (
            <div className="space-y-2">
              <Label>Select target job</Label>
              {jobsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job: Job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} @ {job.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <Alert>
            <AlertDescription>
              Optimization may take up to 30 seconds. A new optimized CV version
              will be created, linked to the original.
            </AlertDescription>
          </Alert>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/my-account/cv/${id}`)}
            className="gap-2 h-auto py-1 px-2 -ml-2 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CV
          </Button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Optimize</span>
        </nav>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Optimize CV
              </h1>
              <p className="text-sm text-muted-foreground">
                Enhance your document with AI-powered improvements
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* CV Info Card */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Document Being Optimized
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Uploaded{" "}
                      {formatDistanceToNow(new Date(cv.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {cv.atsFormatScore !== null && (
                        <Badge variant="outline" className="text-xs">
                          Format: {cv.atsFormatScore}%
                        </Badge>
                      )}
                      {cv.atsContentScore !== null && (
                        <Badge variant="outline" className="text-xs">
                          Content: {cv.atsContentScore}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Type Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Choose Optimization Strategy
                </CardTitle>
                <CardDescription>
                  Select how you want to enhance your CV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={optimizationType}
                  onValueChange={(val) => {
                    setOptimizationType(val as "general" | "job");
                    if (val === "general") setSelectedJobId("");
                  }}
                  className="grid gap-3"
                >
                  {Object.values(optimizationTypes).map((type) => {
                    const Icon = type.icon;
                    const isSelected = optimizationType === type.id;

                    return (
                      <div
                        key={type.id}
                        className={cn(
                          "relative flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                          isSelected
                            ? `border-${type.color}-500 bg-${type.color}-50/50`
                            : "border-muted hover:border-muted-foreground/20",
                        )}
                        onClick={() => {
                          setOptimizationType(type.id as "general" | "job");
                          if (type.id === "general") setSelectedJobId("");
                        }}
                      >
                        <RadioGroupItem
                          value={type.id}
                          id={type.id}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                isSelected
                                  ? `bg-${type.color}-100 text-${type.color}-600`
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <Label
                              htmlFor={type.id}
                              className="font-semibold cursor-pointer"
                            >
                              {type.title}
                            </Label>
                          </div>
                          <p className="text-sm text-muted-foreground ml-10">
                            {type.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            className={cn(
                              "h-5 w-5 absolute top-4 right-4",
                              `text-${type.color}-500`,
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>

                {/* Job Selection */}
                {optimizationType === "job" && (
                  <div className="space-y-2 pt-2 animate-in slide-in-from-top-2">
                    <Label className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-amber-500" />
                      Select Target Position
                    </Label>
                    {jobsLoading ? (
                      <Skeleton className="h-12 w-full" />
                    ) : jobs.length === 0 ? (
                      <Alert
                        variant="destructive"
                        className="bg-red-50 border-red-200"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No jobs found.{" "}
                          <Button
                            variant="link"
                            className="h-auto p-0"
                            onClick={() => router.push("/my-account/jobs")}
                          >
                            Add a job first
                          </Button>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Select
                        value={selectedJobId}
                        onValueChange={setSelectedJobId}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Choose a job to tailor your CV" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {jobs.map((job) => (
                            <SelectItem
                              key={job.id}
                              value={job.id}
                              className="py-3"
                            >
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{job.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {job.company}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={handleOptimize}
                disabled={
                  (optimizationType === "job" && !selectedJobId) ||
                  optimizeMutation.isPending ||
                  jobsLoading
                }
                className={cn(
                  "flex-1 h-12 text-base font-semibold gap-2",
                  "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
                  "text-white shadow-lg shadow-orange-500/25",
                )}
              >
                {optimizeMutation.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Optimizing with AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5" />
                    {optimizationType === "general"
                      ? "Enhance CV"
                      : "Tailor for Job"}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/my-account/cv/${id}`)}
                className="h-12 px-6"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* Sidebar - Info & Benefits */}
          <div className="space-y-4">
            <Card
              className={cn(
                "border-2",
                selectedType.color === "blue"
                  ? "border-blue-200 bg-blue-50/30"
                  : "border-amber-200 bg-amber-50/30",
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TypeIcon
                    className={cn(
                      "h-5 w-5",
                      selectedType.color === "blue"
                        ? "text-blue-600"
                        : "text-amber-600",
                    )}
                  />
                  <CardTitle className="text-base">
                    {selectedType.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {selectedType.description}
                </p>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    What You'll Get
                  </h4>
                  <ul className="space-y-2">
                    {selectedType.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2
                          className={cn(
                            "h-4 w-4 mt-0.5 flex-shrink-0",
                            selectedType.color === "blue"
                              ? "text-blue-500"
                              : "text-amber-500",
                          )}
                        />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estimated time</span>
                  <Badge variant="outline" className="font-mono">
                    {selectedType.estimatedTime}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-slate-500" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-slate-400">•</span>
                    Original CV is preserved; a new optimized version is created
                  </li>
                  <li className="flex gap-2">
                    <span className="text-slate-400">•</span>
                    Job-specific optimization works best with detailed job
                    descriptions
                  </li>
                  <li className="flex gap-2">
                    <span className="text-slate-400">•</span>
                    You can create multiple tailored versions for different
                    roles
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
