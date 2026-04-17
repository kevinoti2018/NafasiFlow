// components/cv/cv-preview-modal.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface CVPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  title: string;
}

export function CVPreviewModal({
  open,
  onOpenChange,
  fileUrl,
  title,
}: CVPreviewModalProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 48); // Account for padding
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
      // Auto-fit on load
      if (containerRef.current) {
        const availableWidth = containerRef.current.clientWidth - 48;
        const fitScale = availableWidth / 595; // A4 width in points
        setScale(Math.min(Math.max(fitScale, 0.8), 1.5));
      }
    },
    [],
  );

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.5));
  const fitToWidth = () => {
    if (containerRef.current) {
      const availableWidth = containerRef.current.clientWidth - 48;
      const fitScale = availableWidth / 595;
      setScale(Math.min(fitScale, 2));
    }
  };

  const goToPrevPage = () => setPageNumber((p) => Math.max(1, p - 1));
  const goToNextPage = () =>
    setPageNumber((p) => Math.min(numPages || 1, p + 1));

  // Calculate page dimensions (A4 = 595 x 842 points)
  const pageWidth = 595 * scale;
  const pageHeight = 842 * scale;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full h-full max-w-none max-h-none p-0 gap-0 rounded-none border-0",
          "sm:w-[98vw] sm:h-[95vh] sm:max-w-[1200px] sm:rounded-lg sm:border",
        )}
      >
        {/* Header */}
        <DialogHeader className="px-3 sm:px-4 py-2 sm:py-3 border-b shrink-0 flex flex-row items-center justify-between gap-2 bg-background">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <DialogTitle className="text-xs sm:text-sm font-medium truncate">
              {title}
            </DialogTitle>
            {numPages && (
              <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                {pageNumber}/{numPages}
              </span>
            )}
          </div>

          {/* Controls - Responsive */}
          <div className="flex items-center gap-1">
            {/* Zoom - Icon only on mobile */}
            <div className="flex items-center border rounded bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={zoomOut}
              >
                <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <span className="text-[10px] sm:text-xs font-medium w-8 sm:w-10 text-center hidden sm:inline">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={zoomIn}
              >
                <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:flex"
                onClick={fitToWidth}
                title="Fit to width"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>

            {/* Page nav */}
            {numPages && numPages > 1 && (
              <div className="flex items-center border rounded bg-muted/30 ml-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <span className="text-[10px] sm:text-xs font-medium px-1 sm:px-2 min-w-[1.5rem] sm:min-w-[2rem] text-center">
                  {pageNumber}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={goToNextPage}
                  disabled={pageNumber >= numPages}
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 ml-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* PDF Container - Horizontal scroll for large pages */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto bg-muted/20 relative"
        >
          <div className="min-h-full flex justify-center p-3 sm:p-4 md:p-6">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div
                  className="bg-white shadow-lg flex items-center justify-center"
                  style={{
                    width: Math.min(pageWidth, containerWidth),
                    height: pageHeight,
                  }}
                >
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary" />
                </div>
              }
              error={
                <div className="flex flex-col items-center justify-center h-64 w-64 bg-white shadow-lg text-muted-foreground p-4 text-center">
                  <p className="font-medium text-sm">Failed to load PDF</p>
                  <p className="text-xs mt-1">File may be corrupted</p>
                </div>
              }
            >
              <div
                className="shadow-2xl bg-white"
                style={{
                  width: pageWidth,
                  height: pageHeight,
                  maxWidth: "none", // Allow horizontal scroll
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  width={pageWidth}
                  scale={1}
                  className="w-full h-full"
                />
              </div>
            </Document>
          </div>
        </div>

        {/* Mobile zoom indicator */}
        <div className="sm:hidden shrink-0 px-3 py-2 border-t bg-background flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Zoom: {Math.round(scale * 100)}%
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={zoomOut}
            >
              <ZoomOut className="h-3 w-3 mr-1" />
              Out
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={zoomIn}
            >
              <ZoomIn className="h-3 w-3 mr-1" />
              In
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={fitToWidth}
            >
              Fit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
