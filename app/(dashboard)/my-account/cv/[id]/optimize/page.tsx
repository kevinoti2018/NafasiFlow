// app/(dashboard)/cv/[cvId]/optimize/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useCV, useOptimizeCV } from "@/hooks/use-cvs";
import { useJobs } from "@/hooks/use-jobs";
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
    router.push(`/my-account/cv/${cv.id}`); // redirect back to CV detail page
  };

  if (cvLoading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!cv) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h2 className="text-2xl font-bold">CV not found</h2>
        <Button className="mt-4" onClick={() => router.push("/cv")}>
          Back to CVs
        </Button>
      </div>
    );
  }

  return (
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
            onClick={handleOptimize}
            disabled={
              (optimizationType === "job" && !selectedJobId) ||
              optimizeMutation.isPending
            }
            className="w-full"
          >
            {optimizeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              "Optimize CV"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
