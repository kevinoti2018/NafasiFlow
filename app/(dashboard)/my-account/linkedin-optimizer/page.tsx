"use client";

import { useState, memo } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronUp, Save, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  useLinkedInProfiles,
  useSaveLinkedInProfile,
} from "@/hooks/use-linkedin";

// ========== Types ==========
interface SectionCardProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}

interface LinkedInFormData {
  name: string;
  headline: string;
  about: string;
  experience: string;
  skills: string;
  certifications: string;
  education: string;
  volunteering: string;
}

// Experience item from extraction API
interface ExtractedExperience {
  role: string;
  company: string;
  duration: string;
  description?: string;
}

// Extracted profile shape (partial)
interface ExtractedProfile {
  name?: string;
  headline?: string;
  about?: string;
  experience?: ExtractedExperience[];
  skills?: string[];
}

// Profile saved in DB (as returned by hooks)
interface SavedProfile {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  // ... other fields as needed
}

// ========== Components ==========
const SectionCard = memo(
  ({ title, value, onChange, placeholder, rows = 4 }: SectionCardProps) => {
    const [expanded, setExpanded] = useState(true);
    return (
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader
          className="py-3 cursor-pointer hover:bg-muted/20 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
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
            />
          </CardContent>
        )}
      </Card>
    );
  },
);
SectionCard.displayName = "SectionCard";

// ========== Main Page ==========
export default function LinkedInOptimizerPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [formData, setFormData] = useState<LinkedInFormData>({
    name: "",
    headline: "",
    about: "",
    experience: "",
    skills: "",
    certifications: "",
    education: "",
    volunteering: "",
  });

  const { data: profilesData, isLoading: profilesLoading } =
    useLinkedInProfiles();
  const saveMutation = useSaveLinkedInProfile();

  // Assume profilesData has a `profiles` array of SavedProfile
  const profiles: SavedProfile[] = profilesData?.profiles || [];

  const handleExtract = async () => {
    if (!url) {
      toast.error("Please enter a LinkedIn profile URL");
      return;
    }
    setExtracting(true);
    try {
      const res = await fetch("/api/linkedin/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as {
        profile: ExtractedProfile;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");
      const profile = data.profile;
      setFormData({
        name: profile.name || "",
        headline: profile.headline || "",
        about: profile.about || "",
        experience:
          profile.experience
            ?.map(
              (exp: ExtractedExperience) =>
                `${exp.role} at ${exp.company} (${exp.duration})\n${exp.description || ""}`,
            )
            .join("\n\n") || "",
        skills: profile.skills?.join(", ") || "",
        certifications: "",
        education: "",
        volunteering: "",
      });
      toast.success("Profile extracted – review and edit sections below");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      toast.error(errorMessage);
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Please give this version a name");
      return;
    }
    const result = await saveMutation.mutateAsync({
      ...formData,
      parentId: undefined,
    });
    const newId = result.profile.id;
    router.push(`/my-account/linkedin-optimizer/${newId}`);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              LinkedIn Profile Optimizer
            </h1>
            <p className="text-muted-foreground">
              Create a new profile version or load an existing one
            </p>
          </div>
          <div className="w-[200px]">
            <Select
              onValueChange={(val) =>
                router.push(`/my-account/linkedin-optimizer/${val}`)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Load existing version" />
              </SelectTrigger>
              <SelectContent>
                {profilesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : profiles.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No profiles yet
                  </SelectItem>
                ) : (
                  profiles.map((p: SavedProfile) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name ||
                        `Version ${p.version} (${new Date(p.createdAt).toLocaleDateString()})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* URL Extraction Card */}
        <Card>
          <CardHeader>
            <CardTitle>Extract from LinkedIn URL</CardTitle>
            <CardDescription>
              Paste a public LinkedIn profile URL to auto‑fill sections
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://www.linkedin.com/in/username/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button
                onClick={handleExtract}
                disabled={extracting}
                variant="outline"
              >
                {extracting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4" />
                )}
                Extract
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* New Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Profile Version</CardTitle>
            <CardDescription>
              Fill in your LinkedIn sections below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Version name (e.g., 'April 2025')"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="mb-2"
            />
            <SectionCard
              title="Headline"
              value={formData.headline}
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, headline: v }))
              }
              placeholder="e.g., Senior Software Engineer | AI Enthusiast"
              rows={2}
            />
            <SectionCard
              title="About / Summary"
              value={formData.about}
              onChange={(v) => setFormData((prev) => ({ ...prev, about: v }))}
              placeholder="Write a compelling summary..."
              rows={5}
            />
            <SectionCard
              title="Experience"
              value={formData.experience}
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, experience: v }))
              }
              placeholder="List your work experiences..."
              rows={8}
            />
            <SectionCard
              title="Skills"
              value={formData.skills}
              onChange={(v) => setFormData((prev) => ({ ...prev, skills: v }))}
              placeholder="e.g., React, TypeScript, Node.js, Python, AWS"
              rows={3}
            />
            <SectionCard
              title="Certifications"
              value={formData.certifications}
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, certifications: v }))
              }
              placeholder="List certifications (name, issuer, date)..."
              rows={4}
            />
            <SectionCard
              title="Education"
              value={formData.education}
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, education: v }))
              }
              placeholder="Degrees, institutions, years..."
              rows={4}
            />
            <SectionCard
              title="Volunteering"
              value={formData.volunteering}
              onChange={(v) =>
                setFormData((prev) => ({ ...prev, volunteering: v }))
              }
              placeholder="Volunteer roles, organizations, contributions..."
              rows={4}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
