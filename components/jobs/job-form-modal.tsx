"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Building2,
  FileText,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { createJobBodySchema, type CreateJobBody } from "@/lib/validations/job";
import type { Job } from "@prisma/client";
import { cn } from "@/lib/utils";

interface JobFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Job;
  onSubmit: (data: CreateJobBody) => Promise<void>;
  isSubmitting?: boolean;
}

export function JobFormModal({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting,
}: JobFormModalProps) {
  const form = useForm<CreateJobBody>({
    resolver: zodResolver(createJobBodySchema),
    defaultValues: {
      title: "",
      company: "",
      rawContent: "",
    },
  });

  const { isDirty, isValid } = form.formState;

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          title: initialData.title || "",
          company: initialData.company || "",
          rawContent: initialData.rawContent || "",
        });
      } else {
        form.reset({ title: "", company: "", rawContent: "" });
      }
    }
  }, [initialData, form, open]);

  const handleSubmit = async (data: CreateJobBody) => {
    await onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  const handleCancel = () => {
    if (isDirty && !isSubmitting) {
      const confirmed = window.confirm(
        "You have unsaved changes. Discard them?",
      );
      if (!confirmed) return;
    }
    onOpenChange(false);
    form.reset();
  };

  const isEditing = !!initialData;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden gap-0 flex flex-col max-h-[90vh]">
        {/* Header Section - Fixed */}
        <div className="shrink-0 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent px-6 py-6 border-b border-border/50">
          <DialogHeader className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    isEditing ? "bg-amber-500/10" : "bg-emerald-500/10",
                  )}
                >
                  {isEditing ? (
                    <Briefcase className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold tracking-tight">
                    {isEditing ? "Edit Opportunity" : "New Opportunity"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                    {isEditing
                      ? "Update the details of your tracked position"
                      : "Track a new position you're pursuing"}
                  </DialogDescription>
                </div>
              </div>
              {isEditing && (
                <Badge variant="secondary" className="text-xs font-medium">
                  Editing
                </Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Form Content - Scrollable */}
        <form
          id="job-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          {/* Job Title Field */}
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2.5">
                <Label
                  htmlFor="job-title"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                  Position Title
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...field}
                  id="job-title"
                  placeholder="e.g., Chief Technology Officer"
                  className={cn(
                    "h-11 transition-all duration-200",
                    "focus-visible:ring-primary/20",
                    fieldState.error &&
                      "border-destructive focus-visible:ring-destructive/20",
                  )}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && (
                  <p className="text-xs text-destructive font-medium">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Company Field */}
          <Controller
            name="company"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2.5">
                <Label
                  htmlFor="job-company"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Organization
                </Label>
                <Input
                  {...field}
                  id="job-company"
                  placeholder="e.g., Acme Corporation"
                  className={cn(
                    "h-11 transition-all duration-200",
                    "focus-visible:ring-primary/20",
                    fieldState.error &&
                      "border-destructive focus-visible:ring-destructive/20",
                  )}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && (
                  <p className="text-xs text-destructive font-medium">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Job Description Field */}
          <Controller
            name="rawContent"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="job-description"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Job Description
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    <span>AI-Powered Analysis</span>
                  </div>
                </div>
                <Textarea
                  {...field}
                  id="job-description"
                  placeholder="Paste the complete job posting here. Include requirements, responsibilities, and qualifications for the best analysis results..."
                  className={cn(
                    "min-h-[220px] resize-y font-mono text-sm leading-relaxed",
                    "focus-visible:ring-primary/20",
                    fieldState.error &&
                      "border-destructive focus-visible:ring-destructive/20",
                  )}
                  aria-invalid={fieldState.invalid}
                />
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Sparkles className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed">
                    Our AI will automatically extract key requirements, identify
                    critical skills, and detect employer pain points to help you
                    tailor your application strategy.
                  </p>
                </div>
                {fieldState.error && (
                  <p className="text-xs text-destructive font-medium">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />
        </form>

        {/* Footer Actions - Fixed */}
        <div className="shrink-0 px-6 py-4 bg-muted/30 border-t border-border/50 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {isDirty ? (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            ) : (
              <span>All changes saved</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              form="job-form"
              disabled={isSubmitting || !isValid}
              className={cn(
                "min-w-[140px]",
                isEditing
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-emerald-600 hover:bg-emerald-700",
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </span>
              ) : (
                <>
                  <Briefcase className="h-4 w-4 mr-2" />
                  {isEditing ? "Save Changes" : "Create Opportunity"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
