"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCVs } from "@/hooks/use-cvs";
import { useCreateApplication } from "@/hooks/use-application";
import { toast } from "sonner";

interface CreateApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle?: string;
  onSuccess?: () => void;
}

export function CreateApplicationModal({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onSuccess,
}: CreateApplicationModalProps) {
  const [selectedCvId, setSelectedCvId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const { data: cvsData, isLoading: cvsLoading } = useCVs({ limit: 100 });
  const createApplication = useCreateApplication();

  const cvs = cvsData?.cvVersions || [];

  const handleSubmit = async () => {
    if (!selectedCvId) {
      toast.error("Please select a CV");
      return;
    }
    try {
      await createApplication.mutateAsync({
        jobId,
        cvVersionId: selectedCvId,
        templateId: selectedTemplateId || undefined,
      });
      toast.success("Application created");
      onOpenChange(false);
      setSelectedCvId("");
      setSelectedTemplateId("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to create application");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply for {jobTitle || "this position"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cv">Select CV</Label>
            <Select value={selectedCvId} onValueChange={setSelectedCvId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a CV..." />
              </SelectTrigger>
              <SelectContent>
                {cvsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : cvs.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No CVs found. Upload one first.
                  </SelectItem>
                ) : (
                  cvs.map((cv) => (
                    <SelectItem key={cv.id} value={cv.id}>
                      {cv.name ||
                        `CV from ${new Date(cv.createdAt).toLocaleDateString()}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {/* Optional template selection – can be added later */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createApplication.isPending}
            >
              {createApplication.isPending
                ? "Creating..."
                : "Create Application"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
