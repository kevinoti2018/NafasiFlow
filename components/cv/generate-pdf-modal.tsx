"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Upload,
  Info,
  FileText,
  Sparkles,
  CheckCircle2,
  X,
  Save,
  AlertTriangle,
} from "lucide-react";
import { useTemplates } from "@/hooks/use-templates";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Brand ───────────────────────────────────────────────────────────────────
const B = "#005f78";
const BA = (a: number) =>
  `${B}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

interface GeneratePdfModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvId: string;
  cvName: string;
  cvTemplateId?: string | null;
  cvProfile?: any;
}

export function GeneratePdfModal({
  open,
  onOpenChange,
  cvId,
  cvName,
  cvTemplateId,
  cvProfile,
}: GeneratePdfModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [useOriginalTemplate, setUseOriginalTemplate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [templateDetails, setTemplateDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { data, isLoading } = useTemplates();
  const allTemplates = data?.templates || [];
  const docxTemplates = allTemplates.filter((t: any) => t.type === "docx");
  const hasTemplates = docxTemplates.length > 0;

  // ── Auto-select default template on load ──────────────────────────
  useEffect(() => {
    if (!data || useOriginalTemplate) return;

    // If CV has an original template, prefer that
    if (cvTemplateId && !selectedTemplateId) {
      setUseOriginalTemplate(true);
      return;
    }

    // Otherwise auto-select: default template first, then first available
    if (!selectedTemplateId) {
      const defaultTemplate = docxTemplates.find((t: any) => t.isDefault);
      const autoSelect = defaultTemplate || docxTemplates[0];
      if (autoSelect) {
        setSelectedTemplateId(autoSelect.id);
      }
    }
  }, [data]);

  // ── Reset state when modal opens ──────────────────────────────────
  useEffect(() => {
    if (open) {
      setShowConfirmation(false);
      setTemplateDetails(null);
      // Re-trigger auto-select
      if (cvTemplateId) {
        setUseOriginalTemplate(true);
        setSelectedTemplateId("");
      } else {
        setUseOriginalTemplate(false);
        const defaultTemplate = docxTemplates.find((t: any) => t.isDefault);
        const autoSelect = defaultTemplate || docxTemplates[0];
        if (autoSelect) setSelectedTemplateId(autoSelect.id);
      }
    }
  }, [open]);

  const finalTemplateId = useOriginalTemplate
    ? cvTemplateId
    : selectedTemplateId;

  // ── Fetch template section metadata when selection changes ────────
  useEffect(() => {
    if (!finalTemplateId) {
      setTemplateDetails(null);
      return;
    }
    if (finalTemplateId === templateDetails?.id) return;

    setLoadingDetails(true);
    fetch(`/api/templates/${finalTemplateId}`)
      .then((r) => r.json())
      .then((d) => setTemplateDetails(d.template))
      .catch(console.error)
      .finally(() => setLoadingDetails(false));
  }, [finalTemplateId]);

  // ── Section mismatch analysis ─────────────────────────────────────
  const cvSections = cvProfile
    ? Object.keys(cvProfile).filter((key) => {
        const value = cvProfile[key];
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "object")
          return value && Object.keys(value).length > 0;
        return !!value;
      })
    : [];

  const templateSections: string[] =
    templateDetails?.metadata?.foundSections || [];
  const missingInTemplate = cvSections.filter(
    (s) => !templateSections.includes(s),
  );
  const missingInCV = templateSections.filter((s) => !cvSections.includes(s));
  const hasMismatch = missingInTemplate.length > 0 || missingInCV.length > 0;
  const isPerfectMatch =
    finalTemplateId && templateDetails && !loadingDetails && !hasMismatch;

  // ── Handlers ──────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (hasMismatch && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    console.log(
      "[Generate] templateId sending:",
      finalTemplateId || null,
      "| CV:",
      cvId,
    );

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
      toast.success(
        result.reused
          ? "Opened cached document"
          : "Document generated successfully",
      );
      onOpenChange(false);
      setShowConfirmation(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate document",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseDefaultStyle = async () => {
    // Prefer a DOCX template over raw PDF generation
    const fallbackTemplate =
      docxTemplates.find((t: any) => t.isDefault) || docxTemplates[0];

    console.log(
      "[Generate] No templates — using:",
      fallbackTemplate?.id || "PDF fallback",
    );

    setIsGenerating(true);
    try {
      const res = await fetch(`/api/cv/${cvId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: fallbackTemplate?.id || null }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Generation failed");
      if (result.fileUrl) window.open(result.fileUrl, "_blank");
      toast.success("Document generated successfully");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate document",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTemplateName =
    (useOriginalTemplate
      ? allTemplates.find((t: any) => t.id === cvTemplateId)?.name
      : allTemplates.find((t: any) => t.id === selectedTemplateId)?.name) || "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full max-w-[560px] p-0 gap-0 overflow-hidden",
          "rounded-2xl border border-zinc-200 dark:border-zinc-800",
          "bg-zinc-50 dark:bg-zinc-950",
        )}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: B }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
              Generate Document
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
              {cvName}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="px-5 py-5 space-y-5">
          {/* No templates state */}
          {!isLoading && !hasTemplates && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    No DOCX templates available
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Upload a DOCX template to use your own formatting, or
                    generate with the default built-in style.
                  </p>
                </div>
              </div>
              <Link
                href="/my-account/templates"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Template
              </Link>
            </div>
          )}

          {/* Template selection */}
          {hasTemplates && (
            <div className="space-y-4">
              {/* Use original template toggle */}
              {cvTemplateId && (
                <label
                  className={cn(
                    "flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all",
                    useOriginalTemplate
                      ? "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300",
                  )}
                >
                  <div
                    className="w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all"
                    style={
                      useOriginalTemplate
                        ? { borderColor: B, background: B }
                        : { borderColor: "#d1d5db" }
                    }
                    onClick={() => {
                      setUseOriginalTemplate(true);
                      setSelectedTemplateId("");
                      setShowConfirmation(false);
                    }}
                  >
                    {useOriginalTemplate && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div
                    className="flex-1"
                    onClick={() => {
                      setUseOriginalTemplate(true);
                      setSelectedTemplateId("");
                      setShowConfirmation(false);
                    }}
                  >
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Use original template
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      The template selected when this CV was uploaded
                    </p>
                  </div>
                </label>
              )}

              {/* Select different template */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    {cvTemplateId
                      ? "Or choose a different template"
                      : "Select template"}
                  </label>
                  {isLoading && (
                    <span className="text-[11px] text-zinc-400">Loading…</span>
                  )}
                </div>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(val) => {
                    setSelectedTemplateId(val);
                    setUseOriginalTemplate(false);
                    setShowConfirmation(false);
                  }}
                  disabled={useOriginalTemplate || isLoading}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 text-sm rounded-xl border bg-white dark:bg-zinc-900",
                      "border-zinc-200 dark:border-zinc-700",
                      "focus:ring-2 disabled:opacity-50",
                    )}
                    style={{ ["--tw-ring-color" as any]: BA(0.3) }}
                  >
                    <SelectValue
                      placeholder={
                        isLoading
                          ? "Loading templates…"
                          : "Select a DOCX template"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-700">
                    {docxTemplates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id} className="text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-zinc-400" />
                          {t.name}
                          {t.isDefault && (
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-1"
                              style={{ background: B }}
                            >
                              Default
                            </span>
                          )}
                          {t.isSystem && !t.isDefault && (
                            <span className="text-[10px] text-zinc-400 ml-1">
                              (System)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  Only DOCX templates are supported for generation. PDF
                  templates are not used.
                </p>
              </div>

              {/* Section analysis */}
              {finalTemplateId && !loadingDetails && templateDetails && (
                <div
                  className={cn(
                    "rounded-xl border p-4 space-y-3",
                    isPerfectMatch
                      ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isPerfectMatch ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Info className="h-4 w-4 text-zinc-400 shrink-0" />
                    )}
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Section Analysis
                      {selectedTemplateName && (
                        <span className="font-normal text-zinc-400 ml-1">
                          — {selectedTemplateName}
                        </span>
                      )}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-zinc-400 cursor-help ml-auto" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-xs">
                          Sections missing from the template will be injected at
                          the end. Sections missing from your CV will be
                          skipped.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {isPerfectMatch && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      Perfect match — all CV sections are present in this
                      template.
                    </p>
                  )}

                  {missingInTemplate.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                        Will be injected at end
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {missingInTemplate.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 text-[11px] font-medium rounded-md border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {missingInCV.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                        Will be skipped (no data in CV)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {missingInCV.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 text-[11px] font-medium rounded-md border border-zinc-200 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loading template details */}
              {finalTemplateId && loadingDetails && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                  <span className="text-xs text-zinc-500">
                    Analysing template sections…
                  </span>
                </div>
              )}

              {/* Mismatch confirmation */}
              {showConfirmation && hasMismatch && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="space-y-1.5">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                        Confirm generation with mismatched sections
                      </p>
                      <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                        {missingInTemplate.length > 0 && (
                          <li>
                            <strong>{missingInTemplate.join(", ")}</strong> will
                            be added at the end of the document.
                          </li>
                        )}
                        {missingInCV.length > 0 && (
                          <li>
                            <strong>{missingInCV.join(", ")}</strong> will be
                            skipped (no data in your CV).
                          </li>
                        )}
                      </ul>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Do you want to proceed?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleGenerate}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white transition-opacity"
                      style={{ background: B }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.opacity = "0.85")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.opacity = "1")
                      }
                    >
                      <Save className="h-3.5 w-3.5" /> Yes, Generate
                    </button>
                    <button
                      onClick={() => setShowConfirmation(false)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-[11px] text-zinc-400 hidden sm:block">
            {finalTemplateId
              ? "Your template will be used for formatting"
              : "No template selected — will use default style"}
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              Cancel
            </button>
            {hasTemplates ? (
              <button
                onClick={handleGenerate}
                disabled={
                  !finalTemplateId ||
                  isGenerating ||
                  (showConfirmation && hasMismatch)
                }
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: B, boxShadow: `0 4px 12px ${BA(0.3)}` }}
                onMouseEnter={(e) =>
                  !isGenerating && (e.currentTarget.style.opacity = "0.85")
                }
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {isGenerating ? (
                  <>
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Document
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleUseDefaultStyle}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all disabled:opacity-50"
                style={{ background: B }}
              >
                {isGenerating ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Use Default Style
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
