"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Copy,
  Save,
  Trash2,
  History,
  Clock,
  Edit,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import {
  useLinkedInProfile,
  useLinkedInVersions,
  useOptimizeLinkedIn,
  useDeleteLinkedInProfile,
} from "@/hooks/use-linkedin";
import { cn } from "@/lib/utils";

// Memoized SectionCard to prevent re-renders
const SectionCard = memo(
  ({
    title,
    value,
    onChange,
    sectionKey,
    placeholder,
    rows = 4,
    showCopy = true,
    isEditing,
    onOptimize,
    isOptimizing,
  }: {
    title: string;
    value: string;
    onChange: (v: string) => void;
    sectionKey: string;
    placeholder: string;
    rows?: number;
    showCopy?: boolean;
    isEditing: boolean;
    onOptimize: () => void;
    isOptimizing: boolean;
  }) => {
    const [expanded, setExpanded] = useState(true);

    const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    };

    return (
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader
          className="py-3 cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            <div className="flex items-center gap-2">
              {showCopy && value && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(value);
                  }}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onOptimize();
                }}
                disabled={isOptimizing}
              >
                {isOptimizing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span className="ml-1 text-xs">Optimize</span>
              </Button>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </CardHeader>
        {expanded && (
          <CardContent className="pt-0">
            <Textarea
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={rows}
              className="font-mono text-sm"
              disabled={!isEditing}
            />
          </CardContent>
        )}
      </Card>
    );
  },
);
SectionCard.displayName = "SectionCard";

export default function LinkedInProfileDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [optimizingSection, setOptimizingSection] = useState<string | null>(
    null,
  );
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    about: "",
    experience: "",
    skills: "",
    certifications: "",
    education: "",
    volunteering: "",
  });

  const { data, isLoading, refetch } = useLinkedInProfile(id as string);
  const { data: versionsData } = useLinkedInVersions(id as string);
  const optimizeMutation = useOptimizeLinkedIn();
  const deleteMutation = useDeleteLinkedInProfile();

  const profile = data?.profile;

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        headline: profile.headline || "",
        about: profile.about || "",
        experience: profile.experience || "",
        skills: profile.skills || "",
        certifications: profile.certifications || "",
        education: profile.education || "",
        volunteering: profile.volunteering || "",
      });
      if (profile.analysisResult) setResult(profile.analysisResult);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/linkedin/profile/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update");
      await refetch();
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleOptimize = async () => {
    if (!profile) return;
    setAnalyzing(true);
    try {
      const optResult = await optimizeMutation.mutateAsync(formData);
      setResult(optResult);
      await fetch(`/api/linkedin/profile/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisResult: optResult }),
      });
      const expSuggestion = optResult.suggestions?.find(
        (s: any) => s.section === "experience",
      );
      if (expSuggestion && expSuggestion.improved) {
        setFormData((prev) => ({
          ...prev,
          experience: expSuggestion.improved,
        }));
        toast.success("Experience improved – save to keep changes");
      } else {
        toast.success("Analysis complete");
      }
      await refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const optimizeSection = useCallback(
    async (section: string, content: string) => {
      setOptimizingSection(section);
      try {
        const res = await fetch("/api/linkedin/optimize-structured", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section, [section]: content }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (data.improved) {
          setFormData((prev) => ({ ...prev, [section]: data.improved }));
          toast.success(`${section} optimized`);
        } else {
          toast.info("No improvement suggested");
        }
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setOptimizingSection(null);
      }
    },
    [],
  );

  const handleDelete = async () => {
    if (!profile) return;
    if (confirm("Delete this profile? This action cannot be undone.")) {
      await deleteMutation.mutateAsync(profile.id);
      router.push("/my-account/linkedin-optimizer");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (!profile)
    return (
      <div className="container mx-auto py-12 text-center">
        Profile not found
      </div>
    );

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {profile.name || "LinkedIn Profile"}
              </h1>
              <p className="text-muted-foreground">
                Version {profile.version} • Created{" "}
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel Edit" : "Edit"}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <Input
            placeholder="Profile name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={!isEditing}
            className="mb-2"
          />
          <SectionCard
            title="Headline"
            value={formData.headline}
            onChange={(v) => setFormData((prev) => ({ ...prev, headline: v }))}
            sectionKey="headline"
            placeholder="e.g., Senior Software Engineer | AI Enthusiast"
            rows={2}
            isEditing={isEditing}
            onOptimize={() => optimizeSection("headline", formData.headline)}
            isOptimizing={optimizingSection === "headline"}
          />
          <SectionCard
            title="About / Summary"
            value={formData.about}
            onChange={(v) => setFormData((prev) => ({ ...prev, about: v }))}
            sectionKey="about"
            placeholder="Write a compelling summary..."
            rows={5}
            isEditing={isEditing}
            onOptimize={() => optimizeSection("about", formData.about)}
            isOptimizing={optimizingSection === "about"}
          />
          <SectionCard
            title="Experience"
            value={formData.experience}
            onChange={(v) =>
              setFormData((prev) => ({ ...prev, experience: v }))
            }
            sectionKey="experience"
            placeholder="List your work experiences..."
            rows={8}
            isEditing={isEditing}
            onOptimize={() =>
              optimizeSection("experience", formData.experience)
            }
            isOptimizing={optimizingSection === "experience"}
          />
          <SectionCard
            title="Skills"
            value={formData.skills}
            onChange={(v) => setFormData((prev) => ({ ...prev, skills: v }))}
            sectionKey="skills"
            placeholder="e.g., React, TypeScript, Node.js, Python, AWS"
            rows={3}
            isEditing={isEditing}
            onOptimize={() => optimizeSection("skills", formData.skills)}
            isOptimizing={optimizingSection === "skills"}
          />
          <SectionCard
            title="Certifications"
            value={formData.certifications}
            onChange={(v) =>
              setFormData((prev) => ({ ...prev, certifications: v }))
            }
            sectionKey="certifications"
            placeholder="List certifications (name, issuer, date)..."
            rows={4}
            isEditing={isEditing}
            onOptimize={() =>
              optimizeSection("certifications", formData.certifications)
            }
            isOptimizing={optimizingSection === "certifications"}
          />
          <SectionCard
            title="Education"
            value={formData.education}
            onChange={(v) => setFormData((prev) => ({ ...prev, education: v }))}
            sectionKey="education"
            placeholder="Degrees, institutions, years..."
            rows={4}
            isEditing={isEditing}
            onOptimize={() => optimizeSection("education", formData.education)}
            isOptimizing={optimizingSection === "education"}
          />
          <SectionCard
            title="Volunteering"
            value={formData.volunteering}
            onChange={(v) =>
              setFormData((prev) => ({ ...prev, volunteering: v }))
            }
            sectionKey="volunteering"
            placeholder="Volunteer roles, organizations, contributions..."
            rows={4}
            isEditing={isEditing}
            onOptimize={() =>
              optimizeSection("volunteering", formData.volunteering)
            }
            isOptimizing={optimizingSection === "volunteering"}
          />
        </div>

        {/* Save button (only when editing) */}
        {isEditing && (
          <div className="flex justify-end">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        )}

        {/* Full Profile Optimize button */}
        <div className="flex justify-end">
          <Button
            onClick={handleOptimize}
            disabled={analyzing}
            className="gap-2"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Full Profile Analysis
          </Button>
        </div>

        {/* Optimization Results (unchanged) */}
        {result && (
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Profile Strength Score
                  <span
                    className={`text-3xl font-bold ${
                      result.score >= 80
                        ? "text-emerald-600"
                        : result.score >= 60
                          ? "text-amber-600"
                          : "text-rose-600"
                    }`}
                  >
                    {result.score}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={result.score} className="h-3" />
                <p className="text-sm text-muted-foreground mt-3">
                  {result.score >= 80
                    ? "Excellent profile! Minor improvements can make it even better."
                    : result.score >= 60
                      ? "Good foundation with room for improvement."
                      : "Significant improvements needed to stand out."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Suggestions</CardTitle>
                <CardDescription>
                  AI‑generated improvements for each section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="suggestions">
                  <TabsList className="mb-4">
                    <TabsTrigger value="suggestions">Improvements</TabsTrigger>
                    <TabsTrigger value="missing">Missing Sections</TabsTrigger>
                    <TabsTrigger value="keywords">Keyword Gaps</TabsTrigger>
                    <TabsTrigger value="tips">Actionable Tips</TabsTrigger>
                  </TabsList>

                  <TabsContent value="suggestions" className="space-y-4">
                    {result.suggestions?.map((s: any, i: number) => (
                      <div key={i} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="capitalize">
                            {s.section}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(s.improved);
                              toast.success("Copied");
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Original:
                          </p>
                          <p className="text-sm bg-muted p-2 rounded mt-1">
                            {s.original || "(empty)"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Improved:
                          </p>
                          <p className="text-sm bg-emerald-50 p-2 rounded mt-1">
                            {s.improved}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Why: {s.reason}
                        </p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="missing">
                    {result.missingSections?.length ? (
                      <div className="space-y-2">
                        {result.missingSections.map((section: string) => (
                          <div
                            key={section}
                            className="flex items-center gap-2 p-2 bg-amber-50 rounded"
                          >
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="capitalize">{section}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        No missing sections detected.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="keywords">
                    {result.keywordGaps?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {result.keywordGaps.map((kw: string) => (
                          <Badge key={kw} variant="secondary">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        Good keyword coverage.
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="tips">
                    <ul className="space-y-2">
                      {result.actionableTips?.map((tip: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Version History Timeline */}
            {versionsData?.versions && versionsData.versions.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Version Timeline
                  </CardTitle>
                  <CardDescription>
                    Previous versions of this profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {versionsData.versions.map((v: any) => (
                      <div
                        key={v.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted",
                          v.id === profile.id && "border-primary bg-primary/5",
                        )}
                        onClick={() =>
                          router.push(`/my-account/linkedin-optimizer/${v.id}`)
                        }
                      >
                        <div>
                          <p className="font-medium">
                            {v.name || `Version ${v.version}`}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(v.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">v{v.version}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
