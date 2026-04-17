// components/cv/cv-edit-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Wrench,
  FileText,
  FolderGit,
  Save,
  X,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { CVInput } from "@/lib/ai/prompts";
import { useUpdateCV } from "@/hooks/use-cvs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CVEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvId: string;
  initialData: CVInput;
  cvName?: string;
  onRestructure?: () => Promise<void>;
}

export function CVEditModal({
  open,
  onOpenChange,
  cvId,
  initialData,
  cvName,
  onRestructure,
}: CVEditModalProps) {
  const [name, setName] = useState(cvName || "");
  const [profile, setProfile] = useState<CVInput>(initialData);
  const updateCV = useUpdateCV();
  const [isRestructuring, setIsRestructuring] = useState(false);

  useEffect(() => {
    setName(cvName || "");
    setProfile(initialData);
  }, [cvName, initialData, open]);

  const handleSave = async () => {
    await updateCV.mutateAsync({ cvId, data: { name, profile } });
    onOpenChange(false);
  };

  const isRawText =
    profile?.rawText && !profile.summary && !profile.experience?.length;
  const hasStructuredData =
    !isRawText &&
    (profile.summary || profile.experience?.length || profile.skills?.length);

  const handleRestructure = async () => {
    if (!onRestructure) return;
    setIsRestructuring(true);
    try {
      await onRestructure();
      toast.success("CV restructured successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to restructure CV");
    } finally {
      setIsRestructuring(false);
    }
  };

  if (isRawText) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold">CV Not Structured</h3>
            <p className="text-sm text-muted-foreground">
              This CV hasn't been processed by AI yet. Please run AI analysis to
              extract structured data before editing.
            </p>
            {onRestructure && (
              <button
                onClick={handleRestructure}
                disabled={isRestructuring}
                className="flex items-center gap-2 px-4 py-2 mx-auto bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
              >
                {isRestructuring ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Run AI Structuring
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-muted transition"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!hasStructuredData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold">No Editable Data</h3>
            <p className="text-sm text-muted-foreground">
              This CV has no extractable sections. Please upload a CV with
              proper content.
            </p>
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ---- Helper functions ----
  const updateSummary = (summary: string) =>
    setProfile((prev) => ({ ...prev, summary }));
  const updateSkills = (skills: string) =>
    setProfile((prev) => ({
      ...prev,
      skills: skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }));

  const addExperience = () =>
    setProfile((prev) => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        { role: "", company: "", duration: "", bullets: [""] },
      ],
    }));
  const updateExperience = (
    idx: number,
    field: string,
    value: string | string[],
  ) => {
    const newExp = [...(profile.experience || [])];
    newExp[idx] = { ...newExp[idx], [field]: value };
    setProfile((prev) => ({ ...prev, experience: newExp }));
  };
  const removeExperience = (idx: number) => {
    const newExp = [...(profile.experience || [])];
    newExp.splice(idx, 1);
    setProfile((prev) => ({ ...prev, experience: newExp }));
  };
  const addBullet = (expIdx: number) => {
    const newExp = [...(profile.experience || [])];
    newExp[expIdx].bullets = [...(newExp[expIdx].bullets || []), ""];
    setProfile((prev) => ({ ...prev, experience: newExp }));
  };
  const updateBullet = (expIdx: number, bulletIdx: number, value: string) => {
    const newExp = [...(profile.experience || [])];
    newExp[expIdx].bullets[bulletIdx] = value;
    setProfile((prev) => ({ ...prev, experience: newExp }));
  };
  const removeBullet = (expIdx: number, bulletIdx: number) => {
    const newExp = [...(profile.experience || [])];
    newExp[expIdx].bullets.splice(bulletIdx, 1);
    setProfile((prev) => ({ ...prev, experience: newExp }));
  };

  const addEducation = () =>
    setProfile((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        { degree: "", institution: "", year: "" },
      ],
    }));
  const updateEducation = (idx: number, field: string, value: string) => {
    const newEdu = [...(profile.education || [])];
    newEdu[idx] = { ...newEdu[idx], [field]: value };
    setProfile((prev) => ({ ...prev, education: newEdu }));
  };
  const removeEducation = (idx: number) => {
    const newEdu = [...(profile.education || [])];
    newEdu.splice(idx, 1);
    setProfile((prev) => ({ ...prev, education: newEdu }));
  };

  const addProject = () =>
    setProfile((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
        { name: "", description: "", technologies: [] },
      ],
    }));
  const updateProject = (idx: number, field: string, value: string | string[]) => {
    const newProj = [...(profile.projects || [])];
    newProj[idx] = { ...newProj[idx], [field]: value };
    setProfile((prev) => ({ ...prev, projects: newProj }));
  };

  const removeProject = (idx: number) => {
    const newProj = [...(profile.projects || [])];
    newProj.splice(idx, 1);
    setProfile((prev) => ({ ...prev, projects: newProj }));
  };
  const updateProjectTechnologies = (idx: number, techString: string) => {
    const newProj = [...(profile.projects || [])];
    newProj[idx].technologies = techString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setProfile((prev) => ({ ...prev, projects: newProj }));
  };

  const SectionCard = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border p-4 space-y-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
      {children}
    </div>
  );

  const DeleteButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-lg transition-all text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );

  const FieldInput = ({
    placeholder,
    value,
    onChange,
  }: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-3 text-sm rounded-lg border outline-none transition-all bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20"
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full h-full max-w-none max-h-none p-0 gap-0 rounded-none border-0",
          "sm:w-[95vw] sm:h-[90vh] sm:max-w-6xl sm:rounded-2xl sm:border-zinc-200 sm:dark:border-zinc-800 sm:shadow-2xl",
          "flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Edit CV
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Update your professional information
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Document Name */}
        <div className="px-6 py-3 shrink-0 flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0 uppercase tracking-wide">
            Document Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Senior Software Engineer CV"
            className="flex-1 h-8 px-3 text-sm rounded-lg border outline-none transition-all bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400/20"
          />
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="summary"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-6 pt-3 pb-0 shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <TabsList className="w-full justify-start gap-1 bg-transparent p-0 h-auto">
              {[
                { value: "summary", icon: FileText, label: "Summary" },
                {
                  value: "experience",
                  icon: Briefcase,
                  label: "Experience",
                  count: profile.experience?.length,
                },
                { value: "skills", icon: Wrench, label: "Skills" },
                {
                  value: "education",
                  icon: GraduationCap,
                  label: "Education",
                  count: profile.education?.length,
                },
                {
                  value: "projects",
                  icon: FolderGit,
                  label: "Projects",
                  count: profile.projects?.length,
                },
              ].map(({ value, icon: Icon, label, count }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-none text-zinc-500 dark:text-zinc-400 border-b-2 border-transparent hover:text-zinc-800 dark:hover:text-zinc-200 transition-all data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 data-[state=active]:border-amber-500 data-[state=active]:bg-transparent bg-transparent shadow-none"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {count != null && count > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.5 text-[10px] rounded-full font-semibold leading-none bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="flex-1 bg-zinc-50 dark:bg-zinc-950">
            <div className="p-6 max-w-2xl mx-auto space-y-4">
              {/* Summary */}
              <TabsContent value="summary" className="mt-0">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Professional Summary
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      A compelling overview of your background and expertise
                    </p>
                  </div>
                  <textarea
                    value={profile.summary || ""}
                    onChange={(e) => updateSummary(e.target.value)}
                    rows={9}
                    placeholder="Write a compelling 3–4 sentence summary highlighting your expertise, key accomplishments, and what you bring to the table..."
                    className="w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all resize-none bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-amber-400 dark:focus:border-amber-600 focus:ring-2 focus:ring-amber-400/20 shadow-sm"
                  />
                </div>
              </TabsContent>

              {/* Experience */}
              <TabsContent value="experience" className="mt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Work Experience
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {profile.experience?.length || 0} position
                      {profile.experience?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={addExperience}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Position
                  </button>
                </div>
                <div className="space-y-3">
                  {profile.experience?.map((exp, idx) => (
                    <SectionCard key={idx}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          Position {idx + 1}
                        </span>
                        <DeleteButton onClick={() => removeExperience(idx)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldInput
                          placeholder="Job Title"
                          value={exp.role || ""}
                          onChange={(v) => updateExperience(idx, "role", v)}
                        />
                        <FieldInput
                          placeholder="Company"
                          value={exp.company || ""}
                          onChange={(v) => updateExperience(idx, "company", v)}
                        />
                      </div>
                      <FieldInput
                        placeholder="Duration (e.g. Jan 2020 – Present)"
                        value={exp.duration || ""}
                        onChange={(v) => updateExperience(idx, "duration", v)}
                      />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Achievements
                        </p>
                        {exp.bullets?.map((bullet, bIdx) => (
                          <div key={bIdx} className="flex gap-2 items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                            <FieldInput
                              placeholder="Start with an action verb..."
                              value={bullet}
                              onChange={(v) => updateBullet(idx, bIdx, v)}
                            />
                            <DeleteButton
                              onClick={() => removeBullet(idx, bIdx)}
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => addBullet(idx)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-amber-400 dark:hover:border-amber-600 hover:text-amber-600 dark:hover:text-amber-400"
                        >
                          <Plus className="h-3 w-3" /> Add bullet
                        </button>
                      </div>
                    </SectionCard>
                  ))}
                </div>
              </TabsContent>

              {/* Skills */}
              <TabsContent value="skills" className="mt-0 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Skills & Expertise
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Separate each skill with a comma
                  </p>
                </div>
                <textarea
                  value={profile.skills?.join(", ") || ""}
                  onChange={(e) => updateSkills(e.target.value)}
                  rows={5}
                  placeholder="React, TypeScript, Node.js, Python, AWS..."
                  className="w-full px-4 py-3 text-sm rounded-xl border outline-none transition-all resize-none bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-amber-400 dark:focus:border-amber-600 focus:ring-2 focus:ring-amber-400/20 shadow-sm"
                />
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profile.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Education */}
              <TabsContent value="education" className="mt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Education
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {profile.education?.length || 0} qualification
                      {profile.education?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={addEducation}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Education
                  </button>
                </div>
                <div className="space-y-3">
                  {profile.education?.map((edu, idx) => (
                    <SectionCard key={idx}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          Education {idx + 1}
                        </span>
                        <DeleteButton onClick={() => removeEducation(idx)} />
                      </div>
                      <FieldInput
                        placeholder="Degree / Certification"
                        value={edu.degree || ""}
                        onChange={(v) => updateEducation(idx, "degree", v)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <FieldInput
                          placeholder="Institution"
                          value={edu.institution || ""}
                          onChange={(v) =>
                            updateEducation(idx, "institution", v)
                          }
                        />
                        <FieldInput
                          placeholder="Year"
                          value={edu.year || ""}
                          onChange={(v) => updateEducation(idx, "year", v)}
                        />
                      </div>
                    </SectionCard>
                  ))}
                </div>
              </TabsContent>

              {/* Projects */}
              <TabsContent value="projects" className="mt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      Projects
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {profile.projects?.length || 0} project
                      {profile.projects?.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    onClick={addProject}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Project
                  </button>
                </div>
                <div className="space-y-3">
                  {profile.projects?.map((proj, idx) => (
                    <SectionCard key={idx}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                          Project {idx + 1}
                        </span>
                        <DeleteButton onClick={() => removeProject(idx)} />
                      </div>
                      <FieldInput
                        placeholder="Project Name"
                        value={proj.name || ""}
                        onChange={(v) => updateProject(idx, "name", v)}
                      />
                      <textarea
                        placeholder="Brief description of what you built and its impact..."
                        value={proj.description || ""}
                        onChange={(e) =>
                          updateProject(idx, "description", e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 text-sm rounded-lg border outline-none transition-all resize-none bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-amber-400 dark:focus:border-amber-600 focus:ring-2 focus:ring-amber-400/20"
                      />
                      <FieldInput
                        placeholder="Technologies (comma-separated)"
                        value={proj.technologies?.join(", ") || ""}
                        onChange={(v) => updateProjectTechnologies(idx, v)}
                      />
                    </SectionCard>
                  ))}
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Changes are saved to your profile
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateCV.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {updateCV.isPending ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
