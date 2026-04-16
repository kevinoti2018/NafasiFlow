// components/templates/template-upload-modal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload } from "lucide-react";
import { useUploadTemplate } from "@/hooks/use-templates";

interface TemplateUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TemplateUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: TemplateUploadModalProps) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState("");
  const uploadMutation = useUploadTemplate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowed.includes(selected.type)) {
        setError("Only PDF or DOCX files are allowed");
        setFile(null);
      } else {
        setError("");
        setFile(selected);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file || !name) {
      setError("Please provide a name and select a file");
      return;
    }
    try {
      await uploadMutation.mutateAsync({ file, name, isDefault });
      onOpenChange(false);
      setName("");
      setFile(null);
      setIsDefault(false);
      setError("");
      if (onSuccess) onSuccess();
    } catch (err) {
      // error already handled in hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Modern Professional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">File (PDF or DOCX)</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">
              Maximum file size: 10MB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked as boolean)}
            />
            <Label htmlFor="isDefault" className="text-sm font-normal">
              Set as default template
            </Label>
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!file || !name || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
