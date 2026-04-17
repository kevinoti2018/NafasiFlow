// app/(dashboard)/templates/[templateId]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Star,
  Pencil,
  Trash2,
  ExternalLink,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from "@/hooks/use-templates";
import { DeleteTemplateDialog } from "@/components/templates/delete-template-dialog";
import { CVVersion } from "@prisma/client";
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
export default function TemplateDetailPage() {
  const { templateId } = useParams();
  const router = useRouter();
  const { data, isLoading, error, refetch } = useTemplate(templateId as string);
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const template = data?.template;

  const handleEdit = async () => {
    if (!template) return;
    await updateTemplate.mutateAsync({
      id: template.id,
      data: { name: editName, isDefault: editIsDefault },
    });
    setIsEditing(false);
    refetch();
  };

  const startEditing = () => {
    setEditName(template?.name || "");
    setEditIsDefault(template?.isDefault || false);
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!template) return;
    await deleteTemplate.mutateAsync(template.id);
    router.push("/my-account/templates");
  };

  if (isLoading) return <TemplateDetailSkeleton />;
  if (error || !template) return <TemplateNotFound />;

  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/my-account/templates")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-name">Template Name</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-default"
                  checked={editIsDefault}
                  onCheckedChange={(checked) =>
                    setEditIsDefault(checked as boolean)
                  }
                />
                <Label htmlFor="edit-default" className="text-sm font-normal">
                  Set as default template
                </Label>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEdit}
                  disabled={updateTemplate.isPending}
                >
                  {updateTemplate.isPending ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {template.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge
                    variant={template.isDefault ? "default" : "outline"}
                    className="gap-1"
                  >
                    {template.isDefault && <Star className="h-3 w-3" />}
                    {template.isDefault ? "Default" : "Custom"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {template.type.toUpperCase()} • Uploaded{" "}
                    {formatDistanceToNow(new Date(template.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader>
          <CardTitle>Preview & Download</CardTitle>
          <CardDescription>View or download the template file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => window.open(template.fileUrl, "_blank")}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(template.fileUrl, "_blank")}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
            <p>File type: {template.type.toUpperCase()}</p>
            <p className="mt-1">
              Size: {((template.metadata?.bytes || 0) / 1024).toFixed(1)} KB
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>
            Where this template is currently used
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {template._count?.cvVersions || 0}
              </div>
              <p className="text-sm text-muted-foreground">CV Versions</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {template._count?.applications || 0}
              </div>
              <p className="text-sm text-muted-foreground">Applications</p>
            </div>
          </div>
          {template.cvVersions && template.cvVersions.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">
                  Recent CVs using this template
                </h3>
                <ul className="space-y-2">
                  {template.cvVersions.slice(0, 5).map((cv: CVVersion) => (
                    <li
                      key={cv.id}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">
                        {cv.name ||
                          `CV from ${formatDistanceToNow(new Date(cv.createdAt))}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/my-account/cv/${cv.id}`)}
                      >
                        View
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
          {template.applications && template.applications.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-2">
                  Recent Applications using this template
                </h3>
                <ul className="space-y-2">
                  {template.applications
                    .slice(0, 5)
                    .map((app: ApplicationWithJob) => (
                      <li
                        key={app.id}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">
                          {app.job?.title || "Untitled Job"} at{" "}
                          {app.job?.company || "Unknown"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(`/my-account/applications/${app.id}`)
                          }
                        >
                          View
                        </Button>
                      </li>
                    ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DeleteTemplateDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        templateName={template.name}
        onConfirm={handleDelete}
        isDeleting={deleteTemplate.isPending}
      />
    </div>
  );
}

function TemplateDetailSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function TemplateNotFound() {
  return (
    <div className="container mx-auto py-12 text-center">
      <h2 className="text-2xl font-bold">Template not found</h2>
      <Button
        className="mt-4"
        onClick={() => (window.location.href = "/my-account/templates")}
      >
        Back to Templates
      </Button>
    </div>
  );
}
