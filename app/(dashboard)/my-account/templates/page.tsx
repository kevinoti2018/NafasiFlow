// app/(dashboard)/templates/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  Trash2,
  Eye,
  MoreHorizontal,
  Download,
  Star,
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TemplateUploadModal } from "@/components/templates/template-upload-modal";
import { DeleteTemplateDialog } from "@/components/templates/delete-template-dialog";
import { useTemplates, useDeleteTemplate } from "@/hooks/use-templates";
import { Template } from "@prisma/client";
type TemplateWithCount = Template & {
  _count?: { cvVersions: number; applications: number };
};
export default function TemplatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(
    null,
  );
  const { data, isLoading } = useTemplates();
  const deleteTemplate = useDeleteTemplate();

  const templates = data?.templates || [];

  const filteredTemplates = templates.filter((t: Template) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    await deleteTemplate.mutateAsync(deletingTemplate.id);
    setDeletingTemplate(null);
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">
            Manage CV templates for generating polished documents
          </p>
        </div>
        <Button onClick={() => setUploadModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Upload Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>
            {filteredTemplates.length} template
            {filteredTemplates.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No templates found. Upload one to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template: Template) => (
                <Card
                  key={template.id}
                  className="group hover:shadow-md transition-all cursor-pointer"
                  onClick={() =>
                    router.push(`/my-account/templates/${template.id}`)
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950">
                          <FileText className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {template.name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {template.type.toUpperCase()} •{" "}
                            {formatDistanceToNow(new Date(template.createdAt), {
                              addSuffix: true,
                            })}
                          </CardDescription>
                        </div>
                      </div>
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
                            onClick={() =>
                              window.open(template.fileUrl, "_blank")
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(template.fileUrl, "_blank")
                            }
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingTemplate(template)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={template.isDefault ? "default" : "outline"}
                        className="gap-1"
                      >
                        {template.isDefault && <Star className="h-3 w-3" />}
                        {template.isDefault ? "Default" : "Custom"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Used by{" "}
                        {(template as TemplateWithCount)._count?.cvVersions ||
                          0}{" "}
                        CVs
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TemplateUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onSuccess={() => {
          // refresh list
        }}
      />

      <DeleteTemplateDialog
        open={!!deletingTemplate}
        onOpenChange={() => setDeletingTemplate(null)}
        templateName={deletingTemplate?.name}
        onConfirm={handleDelete}
        isDeleting={deleteTemplate.isPending}
      />
    </div>
  );
}
