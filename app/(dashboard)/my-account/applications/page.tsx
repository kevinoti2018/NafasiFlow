// app/(dashboard)/applications/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Briefcase, Filter, Search } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications } from "@/hooks/use-application";
import { Application } from "@prisma/client";

const statusColors = {
  saved: "bg-gray-100 text-gray-800",
  applied: "bg-blue-100 text-blue-800",
  interviewing: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
  offered: "bg-green-100 text-green-800",
};
// types/application.ts or at the top of the page
type ApplicationWithJob = {
  id: string;
  userId: string;
  jobId: string;
  cvVersionId: string;
  templateId: string | null;
  matchScore: number | null;

  analysisVersion: number | null;
  status: "saved" | "applied" | "interviewing" | "rejected" | "offered";
  appliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Related job (included via Prisma include)
  job: {
    id: string;
    title: string | null;
    company: string | null;
    // add other job fields if needed (e.g., description, url)
  } | null;
  // Optionally, other relations like cvVersion, template, etc.
};
export default function ApplicationsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useApplications({
    page,
    limit,
    status: status === "all" ? undefined : status,
  });

  const applications = data?.applications || [];
  const pagination = data?.pagination;

  const filteredApps = applications.filter(
    (app: ApplicationWithJob) =>
      app.job?.title?.toLowerCase().includes(search.toLowerCase()) ||
      app.job?.company?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">
            Track your job applications and statuses
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/my-account/jobs")}
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Browse Jobs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
          <CardDescription>
            Manage and track your job applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interviewing">Interviewing</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="offered">Offered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Match Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app: ApplicationWithJob) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/my-account/applications/${app.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        {app.job?.title || "Untitled"}
                      </TableCell>
                      <TableCell>{app.job?.company || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {app.matchScore}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[app.status]}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {app.appliedAt
                          ? format(new Date(app.appliedAt), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredApps.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-muted-foreground"
                      >
                        No applications found. Start by applying to a job.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm self-center">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
