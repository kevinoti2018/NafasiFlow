"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Briefcase, AlertTriangle } from "lucide-react";

interface DeleteJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle?: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteJobDialog({
  open,
  onOpenChange,
  jobTitle,
  onConfirm,
  isDeleting,
}: DeleteJobDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-destructive/20">
        <AlertDialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-xl font-semibold">
            Delete Job Opportunity
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground leading-relaxed">
            You are about to permanently delete{" "}
            <span className="font-medium text-foreground bg-muted px-1.5 py-0.5 rounded">
              {jobTitle}
            </span>
            . This will remove all associated analyses, applications, and
            historical data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3 sm:gap-3">
          <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto">
            Keep Job
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </span>
            ) : (
              "Delete Permanently"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
