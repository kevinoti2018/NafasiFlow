"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload } from "lucide-react";
import { useTemplates } from "@/hooks/use-templates";
import { toast } from "sonner";
import Link from "next/link";

interface GeneratePdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvId: string;
  cvName: string;
  cvTemplateId?: string | null; // the template associated with this CV at upload time
}

export function GeneratePdfModal({
  open,
  onOpenChange,
  cvId,
  cvName,
  cvTemplateId,
}: GeneratePdfModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [useOriginalTemplate, setUseOriginalTemplate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { data, isLoading } = useTemplates();

  const templates = data?.templates || [];
  const hasTemplates = templates.length > 0;

  // Determine the final template ID to send to the API
  const finalTemplateId = useOriginalTemplate
    ? cvTemplateId
    : selectedTemplateId;

  const handleGenerate = async () => {
    if (!finalTemplateId && hasTemplates) {
      toast.error("Please select a template or use the original one");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/cv/${cvId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: finalTemplateId || null }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Generation failed");
      if (result.fileUrl) window.open(result.fileUrl, "_blank");
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate PDF";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const useDefault = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/cv/${cvId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: null }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Generation failed");
      if (result.fileUrl) window.open(result.fileUrl, "_blank");
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate PDF";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate PDF for {cvName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {!hasTemplates && !isLoading ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <p>
                  No templates available. You can upload your own template or
                  use the default style.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/my-account/templates">
                    <Upload className="h-3 w-3 mr-1" />
                    Upload Template
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {/* Checkbox for using the original template (if exists) */}
              {cvTemplateId && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useOriginal"
                    checked={useOriginalTemplate}
                    onCheckedChange={(checked) => {
                      setUseOriginalTemplate(checked as boolean);
                      if (checked) setSelectedTemplateId(""); // clear selection when using original
                    }}
                  />
                  <Label htmlFor="useOriginal" className="text-sm font-normal">
                    Use the template I selected when uploading this CV
                  </Label>
                </div>
              )}

              {/* Template selector – disabled if using original template */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Or choose a different template
                </label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(val) => {
                    setSelectedTemplateId(val);
                    if (val) setUseOriginalTemplate(false);
                  }}
                  disabled={useOriginalTemplate}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoading ? "Loading templates..." : "Select a template"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(
                      (template: {
                        id: string;
                        name: string;
                        isSystem: boolean;
                      }) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                          {template.isSystem && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (System)
                            </span>
                          )}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {hasTemplates ? (
              <Button
                onClick={handleGenerate}
                disabled={(!finalTemplateId && hasTemplates) || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate PDF"}
              </Button>
            ) : (
              <Button onClick={useDefault} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Use Default Style"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
