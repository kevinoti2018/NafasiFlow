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
import { FileX2, AlertTriangle } from "lucide-react";

interface DeleteCVDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvName?: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteCVDialog({
  open,
  onOpenChange,
  cvName,
  onConfirm,
  isDeleting,
}: DeleteCVDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-destructive/20">
        <AlertDialogHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <FileX2 className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-center text-xl font-semibold">
            Remove CV
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-muted-foreground leading-relaxed">
            You are about to permanently delete{" "}
            <span className="font-medium text-foreground bg-muted px-1.5 py-0.5 rounded">
              {cvName || "Untitled CV"}
            </span>
            . This will remove all associated job applications and analysis
            history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3 sm:gap-3">
          <AlertDialogCancel disabled={isDeleting} className="w-full sm:w-auto">
            Keep CV
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Removing...
              </span>
            ) : (
              "Remove Permanently"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
