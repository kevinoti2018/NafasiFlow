// app/(dashboard)/applications/[appId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Calendar,
  Clock,
  RefreshCw,
  Trash2,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApplication,
  useApplicationTimeline,
  useUpdateApplication,
  useDeleteApplication,
} from "@/hooks/use-application";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusColors = {
  saved: "bg-gray-100 text-gray-800",
  applied: "bg-blue-100 text-blue-800",
  interviewing: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
  offered: "bg-green-100 text-green-800",
};

const statusOrder = ["saved", "applied", "interviewing", "offered", "rejected"];

export default function ApplicationDetailPage() {
  const { appId } = useParams();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data, isLoading } = useApplication(appId as string);
  const { data: timeline } = useApplicationTimeline(appId as string);
  const updateMutation = useUpdateApplication();
  const deleteMutation = useDeleteApplication();

  const application = data?.application;

  const handleStatusChange = async (newStatus: string) => {
    if (!application) return;
    await updateMutation.mutateAsync({
      id: application.id,
      data: { status: newStatus },
    });
    setSelectedStatus("");
  };

  const handleDelete = async () => {
    if (!application) return;
    if (confirm("Are you sure you want to delete this application?")) {
      await deleteMutation.mutateAsync(application.id);
      router.push("/my-account/applications");
    }
  };

  if (isLoading) return <DetailSkeleton />;
  if (!application) return <NotFound />;

  const job = application.job;
  const cv = application.cvVersion;
  const analysisSnapshot = application.aiInsightsSnapshot;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Application Details
          </h1>
          <p className="text-sm text-muted-foreground">
            {job?.title} at {job?.company}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Title</span>
              <span className="font-medium">{job?.title || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Company</span>
              <span className="font-medium">{job?.company || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Match Score</span>
              <Badge variant="outline" className="font-mono">
                {application.matchScore}%
              </Badge>
            </div>
            <Button
              variant="link"
              className="px-0"
              onClick={() => router.push(`/my-account/jobs/${job?.id}`)}
            >
              View Job Details
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CV Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CV Name</span>
              <span className="font-medium">
                {cv?.name ||
                  `CV from ${format(new Date(cv?.createdAt), "PPP")}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format Score</span>
              <span>{cv?.atsFormatScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Content Score</span>
              <span>{cv?.atsContentScore}%</span>
            </div>
            <Button
              variant="link"
              className="px-0"
              onClick={() => router.push(`/my-account/cv/${cv?.id}`)}
            >
              View CV
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge
              className={cn("capitalize", statusColors[application.status])}
            >
              {application.status}
            </Badge>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Update status" />
              </SelectTrigger>
              <SelectContent>
                {statusOrder.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
          {application.appliedAt && (
            <div className="text-sm text-muted-foreground">
              Applied on {format(new Date(application.appliedAt), "PPP")}
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="analysis">
        <TabsList>
          <TabsTrigger value="analysis">AI Analysis Snapshot</TabsTrigger>
          <TabsTrigger value="timeline">Status Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Match Analysis (at time of application)</CardTitle>
              <CardDescription>
                AI evaluation snapshot – not updated with CV changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
                {JSON.stringify(analysisSnapshot, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline?.timeline?.length ? (
                <div className="space-y-4">
                  {timeline.timeline.map((entry: any) => (
                    <div key={entry.id} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-muted-foreground">
                        {format(new Date(entry.changedAt), "PPp")}
                      </div>
                      <Badge className={statusColors[entry.status]}>
                        {entry.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No status history available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="container mx-auto py-12 text-center">
      <h2 className="text-2xl font-bold">Application not found</h2>
      <Button
        className="mt-4"
        onClick={() => (window.location.href = "/my-account/applications")}
      >
        Back to Applications
      </Button>
    </div>
  );
}
