"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  User,
  Award,
  Users,
  Heart,
} from "lucide-react";
import { CVInput } from "@/lib/ai/prompts";
import { useUpdateCV } from "@/hooks/use-cvs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const BRAND = "#005f78";
const BRAND_ALPHA = (a: number) =>
  `${BRAND}${Math.round(a * 255)
    .toString(16)
    .padStart(2, "0")}`;

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
  const [activeTab, setActiveTab] = useState("summary");
  const updateCV = useUpdateCV();
  const [isRestructuring, setIsRestructuring] = useState(false);

  useEffect(() => {
    setName(cvName || "");
    setProfile(initialData);
    setActiveTab("summary");
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
    } catch {
      toast.error("Failed to restructure CV");
    } finally {
      setIsRestructuring(false);
    }
  };

  // ── Guard modals ─────────────────────────────────────────────────────────────
  if (isRawText || !hasStructuredData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-8 rounded-2xl">
          <div className="text-center space-y-5">
            <div
              className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center"
              style={{ background: BRAND_ALPHA(0.1) }}
            >
              <AlertCircle className="h-7 w-7" style={{ color: BRAND }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {isRawText ? "CV Not Structured" : "No Editable Data"}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                {isRawText
                  ? "This CV hasn't been processed by AI yet. Run AI structuring to extract editable sections."
                  : "This CV has no extractable sections. Please upload a CV with proper content."}
              </p>
            </div>
            {isRawText && onRestructure && (
              <button
                onClick={handleRestructure}
                disabled={isRestructuring}
                className="flex items-center gap-2 px-5 py-2.5 mx-auto text-sm font-medium text-white rounded-xl transition-all disabled:opacity-50"
                style={{ background: BRAND }}
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
              className="px-5 py-2 text-sm border rounded-xl hover:bg-zinc-50 transition text-zinc-600"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Mutation helpers ─────────────────────────────────────────────────────────
  const updateSummary = (s: string) =>
    setProfile((p) => ({ ...p, summary: s }));
  const updateSkills = (s: string) =>
    setProfile((p) => ({
      ...p,
      skills: s
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    }));
  const updateContact = (field: string, value: string) =>
    setProfile((p) => ({ ...p, contact: { ...p.contact, [field]: value } }));

  const addExperience = () =>
    setProfile((p) => ({
      ...p,
      experience: [
        ...(p.experience || []),
        { role: "", company: "", duration: "", bullets: [""] },
      ],
    }));
  const updateExperience = (i: number, f: string, v: string) => {
    const arr = [...(profile.experience || [])];
    arr[i] = { ...arr[i], [f]: v };
    setProfile((p) => ({ ...p, experience: arr }));
  };
  const removeExperience = (i: number) => {
    const arr = [...(profile.experience || [])];
    arr.splice(i, 1);
    setProfile((p) => ({ ...p, experience: arr }));
  };
  const addBullet = (ei: number) => {
    const arr = [...(profile.experience || [])];
    arr[ei].bullets = [...(arr[ei].bullets || []), ""];
    setProfile((p) => ({ ...p, experience: arr }));
  };
  const updateBullet = (ei: number, bi: number, v: string) => {
    const arr = [...(profile.experience || [])];
    arr[ei].bullets[bi] = v;
    setProfile((p) => ({ ...p, experience: arr }));
  };
  const removeBullet = (ei: number, bi: number) => {
    const arr = [...(profile.experience || [])];
    arr[ei].bullets.splice(bi, 1);
    setProfile((p) => ({ ...p, experience: arr }));
  };

  const addEducation = () =>
    setProfile((p) => ({
      ...p,
      education: [
        ...(p.education || []),
        { degree: "", institution: "", year: "" },
      ],
    }));
  const updateEducation = (i: number, f: string, v: string) => {
    const arr = [...(profile.education || [])];
    arr[i] = { ...arr[i], [f]: v };
    setProfile((p) => ({ ...p, education: arr }));
  };
  const removeEducation = (i: number) => {
    const arr = [...(profile.education || [])];
    arr.splice(i, 1);
    setProfile((p) => ({ ...p, education: arr }));
  };

  const addProject = () =>
    setProfile((p) => ({
      ...p,
      projects: [
        ...(p.projects || []),
        { name: "", description: "", technologies: [] },
      ],
    }));
  const updateProject = (i: number, f: string, v: string | string[]) => {
    const arr = [...(profile.projects || [])];
    arr[i] = { ...arr[i], [f]: v };
    setProfile((p) => ({ ...p, projects: arr }));
  };
  const removeProject = (i: number) => {
    const arr = [...(profile.projects || [])];
    arr.splice(i, 1);
    setProfile((p) => ({ ...p, projects: arr }));
  };
  const updateProjectTechs = (i: number, v: string) => {
    const arr = [...(profile.projects || [])];
    arr[i].technologies = v
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setProfile((p) => ({ ...p, projects: arr }));
  };

  const addCertification = () =>
    setProfile((p) => ({
      ...p,
      certifications: [
        ...(p.certifications || []),
        { name: "", issuer: "", date: "" },
      ],
    }));
  const updateCertification = (i: number, f: string, v: string) => {
    const arr = [...(profile.certifications || [])];
    arr[i] = { ...arr[i], [f]: v };
    setProfile((p) => ({ ...p, certifications: arr }));
  };
  const removeCertification = (i: number) => {
    const arr = [...(profile.certifications || [])];
    arr.splice(i, 1);
    setProfile((p) => ({ ...p, certifications: arr }));
  };

  const addReferee = () =>
    setProfile((p) => ({
      ...p,
      referees: [
        ...(p.referees || []),
        { name: "", position: "", company: "", email: "", phone: "" },
      ],
    }));
  const updateReferee = (i: number, f: string, v: string) => {
    const arr = [...(profile.referees || [])];
    arr[i] = { ...arr[i], [f]: v };
    setProfile((p) => ({ ...p, referees: arr }));
  };
  const removeReferee = (i: number) => {
    const arr = [...(profile.referees || [])];
    arr.splice(i, 1);
    setProfile((p) => ({ ...p, referees: arr }));
  };

  const addExtra = () =>
    setProfile((p) => ({
      ...p,
      extracurricular: [
        ...(p.extracurricular || []),
        { activity: "", role: "", description: "" },
      ],
    }));
  const updateExtra = (i: number, f: string, v: string) => {
    const arr = [...(profile.extracurricular || [])];
    arr[i] = { ...arr[i], [f]: v };
    setProfile((p) => ({ ...p, extracurricular: arr }));
  };
  const removeExtra = (i: number) => {
    const arr = [...(profile.extracurricular || [])];
    arr.splice(i, 1);
    setProfile((p) => ({ ...p, extracurricular: arr }));
  };

  // ── Tab definitions ──────────────────────────────────────────────────────────
  const tabs = [
    { id: "summary", icon: FileText, label: "Summary" },
    {
      id: "experience",
      icon: Briefcase,
      label: "Experience",
      count: profile.experience?.length,
    },
    { id: "skills", icon: Wrench, label: "Skills" },
    {
      id: "education",
      icon: GraduationCap,
      label: "Education",
      count: profile.education?.length,
    },
    {
      id: "projects",
      icon: FolderGit,
      label: "Projects",
      count: profile.projects?.length,
    },
    { id: "contact", icon: User, label: "Contact" },
    {
      id: "certifications",
      icon: Award,
      label: "Certs",
      count: profile.certifications?.length,
    },
    {
      id: "referees",
      icon: Users,
      label: "Referees",
      count: profile.referees?.length,
    },
    {
      id: "extracurricular",
      icon: Heart,
      label: "Activities",
      count: profile.extracurricular?.length,
    },
  ];

  // ── Primitive components ─────────────────────────────────────────────────────
  const focusStyle = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = BRAND;
      e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND_ALPHA(0.15)}`;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "";
      e.currentTarget.style.boxShadow = "";
    },
  };

  const baseInputCls = cn(
    "w-full text-sm rounded-lg border outline-none transition-all",
    "bg-white dark:bg-zinc-900",
    "border-zinc-200 dark:border-zinc-700",
    "text-zinc-900 dark:text-zinc-100",
    "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
  );

  const Field = ({
    placeholder,
    value,
    onChange,
    className,
  }: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    className?: string;
  }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(baseInputCls, "h-9 px-3", className)}
      {...focusStyle}
    />
  );

  const Textarea = ({
    placeholder,
    value,
    onChange,
    rows = 3,
  }: {
    placeholder: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
  }) => (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={cn(baseInputCls, "px-3 py-2.5 resize-none leading-relaxed")}
      {...focusStyle}
    />
  );

  const AddBtn = ({
    onClick,
    label,
  }: {
    onClick: () => void;
    label: string;
  }) => (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-opacity text-white shrink-0"
      style={{ background: BRAND }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );

  const DelBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-8 h-8 rounded-lg transition-all text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900 shrink-0"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );

  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
      {children}
    </div>
  );

  const CardHead = ({
    label,
    onDelete,
  }: {
    label: string;
    onDelete: () => void;
  }) => (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {label}
      </span>
      <DelBtn onClick={onDelete} />
    </div>
  );

  const CardBody = ({ children }: { children: React.ReactNode }) => (
    <div className="p-4 space-y-3">{children}</div>
  );

  const SectionTop = ({
    title,
    sub,
    onAdd,
    btnLabel,
  }: {
    title: string;
    sub: string;
    onAdd: () => void;
    btnLabel: string;
  }) => (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
          {title}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{sub}</p>
      </div>
      <AddBtn onClick={onAdd} label={btnLabel} />
    </div>
  );

  const Empty = ({
    icon: Icon,
    label,
    sub,
  }: {
    icon: React.ElementType;
    label: string;
    sub: string;
  }) => (
    <div className="flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center gap-2">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-5 w-5 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>
    </div>
  );

  const TagRow = ({ items }: { items: string[] }) =>
    items.length > 0 ? (
      <div className="flex flex-wrap gap-1.5 pt-1">
        {items.map((t, i) => (
          <span
            key={i}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg"
            style={{ background: BRAND_ALPHA(0.1), color: BRAND }}
          >
            {t}
          </span>
        ))}
      </div>
    ) : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "w-full h-full max-w-none max-h-none p-0 gap-0 rounded-none border-0",
          "sm:w-[96vw] sm:h-[92vh] sm:max-w-5xl sm:rounded-2xl sm:border",
          "flex flex-col overflow-hidden",
          "bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800",
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-3.5 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: BRAND }}
          >
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 shrink-0 hidden sm:block">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Document name…"
              className="flex-1 min-w-0 h-8 px-3 text-sm font-medium rounded-lg border outline-none transition-all bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              onFocus={(e) => {
                e.currentTarget.style.borderColor = BRAND;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${BRAND_ALPHA(0.15)}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            />
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Tab strip ─────────────────────────────────────────────────── */}
        <div
          className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <nav className="flex items-end px-4 min-w-max">
            {tabs.map(({ id, icon: Icon, label, count }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap",
                    active
                      ? "border-b-2"
                      : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200",
                  )}
                  style={
                    active ? { borderBottomColor: BRAND, color: BRAND } : {}
                  }
                >
                  {active && (
                    <span
                      className="absolute inset-x-0 bottom-0 top-1 rounded-t-lg"
                      style={{ background: BRAND_ALPHA(0.08) }}
                    />
                  )}
                  <Icon className="h-3.5 w-3.5 relative z-10" />
                  <span className="relative z-10">{label}</span>
                  {count != null && count > 0 && (
                    <span
                      className="relative z-10 ml-0.5 min-w-[16px] px-1 py-0.5 text-[9px] rounded-full font-bold leading-none text-center"
                      style={{
                        background: active ? BRAND : "#94a3b8",
                        color: "white",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Scrollable content area ────────────────────────────────────── */}
        <ScrollArea className="flex-1 min-h-0 bg-zinc-50 dark:bg-zinc-950">
          <div className="px-5 py-6 sm:px-8 max-w-3xl mx-auto w-full">
            {/* SUMMARY */}
            {activeTab === "summary" && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Professional Summary
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    A compelling overview of your background and expertise
                  </p>
                </div>
                <Textarea
                  placeholder="Write a compelling 3–4 sentence summary highlighting your expertise, key accomplishments, and what makes you stand out…"
                  value={profile.summary || ""}
                  onChange={updateSummary}
                  rows={10}
                />
              </div>
            )}

            {/* EXPERIENCE */}
            {activeTab === "experience" && (
              <div>
                <SectionTop
                  title="Work Experience"
                  sub={`${profile.experience?.length || 0} position${profile.experience?.length !== 1 ? "s" : ""}`}
                  onAdd={addExperience}
                  btnLabel="Add Position"
                />
                <div className="space-y-4">
                  {profile.experience?.map((exp, i) => (
                    <Card key={i}>
                      <CardHead
                        label={`Position ${i + 1}`}
                        onDelete={() => removeExperience(i)}
                      />
                      <CardBody>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field
                            placeholder="Job Title"
                            value={exp.role || ""}
                            onChange={(v) => updateExperience(i, "role", v)}
                          />
                          <Field
                            placeholder="Company"
                            value={exp.company || ""}
                            onChange={(v) => updateExperience(i, "company", v)}
                          />
                        </div>
                        <Field
                          placeholder="Duration (e.g. Jan 2020 – Present)"
                          value={exp.duration || ""}
                          onChange={(v) => updateExperience(i, "duration", v)}
                        />
                        <div className="pt-1 space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                            Achievements
                          </p>
                          <div className="space-y-2">
                            {exp.bullets?.map((b, bi) => (
                              <div key={bi} className="flex items-center gap-2">
                                <span
                                  className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
                                  style={{ background: BRAND }}
                                />
                                <Field
                                  placeholder="Start with an action verb…"
                                  value={b}
                                  onChange={(v) => updateBullet(i, bi, v)}
                                />
                                <DelBtn onClick={() => removeBullet(i, bi)} />
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => addBullet(i)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 transition-all mt-1 hover:text-white"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = BRAND;
                              e.currentTarget.style.background = BRAND;
                              e.currentTarget.style.color = "white";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "";
                              e.currentTarget.style.background = "";
                              e.currentTarget.style.color = "";
                            }}
                          >
                            <Plus className="h-3 w-3" /> Add bullet
                          </button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  {!profile.experience?.length && (
                    <Empty
                      icon={Briefcase}
                      label="No positions yet"
                      sub="Click Add Position to get started"
                    />
                  )}
                </div>
              </div>
            )}

            {/* SKILLS */}
            {activeTab === "skills" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Skills & Expertise
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Separate each skill with a comma
                  </p>
                </div>
                <Textarea
                  placeholder="React, TypeScript, Node.js, Python, AWS, Docker, Figma…"
                  value={profile.skills?.join(", ") || ""}
                  onChange={updateSkills}
                  rows={6}
                />
                {profile.skills && profile.skills.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
                      Preview
                    </p>
                    <TagRow items={profile.skills} />
                  </div>
                )}
              </div>
            )}

            {/* EDUCATION */}
            {activeTab === "education" && (
              <div>
                <SectionTop
                  title="Education"
                  sub={`${profile.education?.length || 0} qualification${profile.education?.length !== 1 ? "s" : ""}`}
                  onAdd={addEducation}
                  btnLabel="Add Education"
                />
                <div className="space-y-4">
                  {profile.education?.map((edu, i) => (
                    <Card key={i}>
                      <CardHead
                        label={`Education ${i + 1}`}
                        onDelete={() => removeEducation(i)}
                      />
                      <CardBody>
                        <Field
                          placeholder="Degree / Certification"
                          value={edu.degree || ""}
                          onChange={(v) => updateEducation(i, "degree", v)}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field
                            placeholder="Institution"
                            value={edu.institution || ""}
                            onChange={(v) =>
                              updateEducation(i, "institution", v)
                            }
                          />
                          <Field
                            placeholder="Year (e.g. 2018 – 2022)"
                            value={edu.year || ""}
                            onChange={(v) => updateEducation(i, "year", v)}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  {!profile.education?.length && (
                    <Empty
                      icon={GraduationCap}
                      label="No education added"
                      sub="Click Add Education to get started"
                    />
                  )}
                </div>
              </div>
            )}

            {/* PROJECTS */}
            {activeTab === "projects" && (
              <div>
                <SectionTop
                  title="Projects"
                  sub={`${profile.projects?.length || 0} project${profile.projects?.length !== 1 ? "s" : ""}`}
                  onAdd={addProject}
                  btnLabel="Add Project"
                />
                <div className="space-y-5">
                  {profile.projects?.map((proj, i) => (
                    <Card key={i}>
                      <CardHead
                        label={`Project ${i + 1}`}
                        onDelete={() => removeProject(i)}
                      />
                      <CardBody>
                        <Field
                          placeholder="Project Name"
                          value={proj.name || ""}
                          onChange={(v) => updateProject(i, "name", v)}
                        />

                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                            Description
                          </p>
                          <Textarea
                            placeholder="What did you build? What problem did it solve? What was the impact?"
                            value={proj.description || ""}
                            onChange={(v) => updateProject(i, "description", v)}
                            rows={5}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
                            Technologies
                          </p>
                          <Field
                            placeholder="React, Node.js, PostgreSQL, Docker…"
                            value={proj.technologies?.join(", ") || ""}
                            onChange={(v) => updateProjectTechs(i, v)}
                          />
                          <TagRow items={proj.technologies || []} />
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  {!profile.projects?.length && (
                    <Empty
                      icon={FolderGit}
                      label="No projects added"
                      sub="Click Add Project to showcase your work"
                    />
                  )}
                </div>
              </div>
            )}

            {/* CONTACT */}
            {activeTab === "contact" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Personal Information
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Your contact details and online presence
                  </p>
                </div>
                <Card>
                  <CardBody>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { f: "name", p: "Full Name" },
                        { f: "email", p: "Email Address" },
                        { f: "phone", p: "Phone Number" },
                        { f: "location", p: "Location (City, Country)" },
                        { f: "linkedin", p: "LinkedIn URL" },
                        { f: "github", p: "GitHub URL" },
                        { f: "website", p: "Personal Website" },
                        { f: "twitter", p: "Twitter / X Handle" },
                      ].map(({ f, p }) => (
                        <Field
                          key={f}
                          placeholder={p}
                          value={(profile.contact as any)?.[f] || ""}
                          onChange={(v) => updateContact(f, v)}
                        />
                      ))}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* CERTIFICATIONS */}
            {activeTab === "certifications" && (
              <div>
                <SectionTop
                  title="Certifications"
                  sub="Professional certifications and credentials"
                  onAdd={addCertification}
                  btnLabel="Add Certification"
                />
                <div className="space-y-4">
                  {profile.certifications?.map((cert, i) => (
                    <Card key={i}>
                      <CardHead
                        label={`Certification ${i + 1}`}
                        onDelete={() => removeCertification(i)}
                      />
                      <CardBody>
                        <Field
                          placeholder="Certification Name"
                          value={cert.name || ""}
                          onChange={(v) => updateCertification(i, "name", v)}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field
                            placeholder="Issuing Organization"
                            value={cert.issuer || ""}
                            onChange={(v) =>
                              updateCertification(i, "issuer", v)
                            }
                          />
                          <Field
                            placeholder="Date (e.g. 2023)"
                            value={cert.date || ""}
                            onChange={(v) => updateCertification(i, "date", v)}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  {!profile.certifications?.length && (
                    <Empty
                      icon={Award}
                      label="No certifications added"
                      sub="Click Add Certification to get started"
                    />
                  )}
                </div>
              </div>
            )}

            {/* REFEREES */}
            {activeTab === "referees" && (
              <div>
                <SectionTop
                  title="Referees"
                  sub="Professional references"
                  onAdd={addReferee}
                  btnLabel="Add Referee"
                />
                <div className="space-y-4">
                  {profile.referees?.map((ref, i) => (
                    <Card key={i}>
                      <CardHead
                        label={`Referee ${i + 1}`}
                        onDelete={() => removeReferee(i)}
                      />
                      <CardBody>
                        <Field
                          placeholder="Full Name"
                          value={ref.name || ""}
                          onChange={(v) => updateReferee(i, "name", v)}
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <Field
                            placeholder="Position / Title"
                            value={ref.position || ""}
                            onChange={(v) => updateReferee(i, "position", v)}
                          />
                          <Field
                            placeholder="Company"
                            value={ref.company || ""}
                            onChange={(v) => updateReferee(i, "company", v)}
                          />
                          <Field
                            placeholder="Email"
                            value={ref.email || ""}
                            onChange={(v) => updateReferee(i, "email", v)}
                          />
                          <Field
                            placeholder="Phone"
                            value={ref.phone || ""}
                            onChange={(v) => updateReferee(i, "phone", v)}
                          />
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  {!profile.referees?.length && (
                    <Empty
                      icon={Users}
                      label="No referees added"
                      sub="Click Add Referee to get started"
                    />
                  )}
                </div>
              </div>
            )}

            {/* EXTRACURRICULAR */}
            {activeTab === "extracurricular" && (
              <div>
                <SectionTop
                  title="Extracurricular Activities"
                  sub="Volunteering, leadership, sports, clubs"
                  onAdd={addExtra}
                  btnLabel="Add Activity"
                />
                <div className="space-y-4">
                  {profile.extracurricular?.map((act, i) => (
                    <Card key={i}>
                      <CardHead
                        label={`Activity ${i + 1}`}
                        onDelete={() => removeExtra(i)}
                      />
                      <CardBody>
                        <Field
                          placeholder="Activity Name"
                          value={act.activity || ""}
                          onChange={(v) => updateExtra(i, "activity", v)}
                        />
                        <Field
                          placeholder="Your Role (e.g. Volunteer, Team Captain)"
                          value={act.role || ""}
                          onChange={(v) => updateExtra(i, "role", v)}
                        />
                        <Textarea
                          placeholder="Brief description of your involvement and impact…"
                          value={act.description || ""}
                          onChange={(v) => updateExtra(i, "description", v)}
                          rows={3}
                        />
                      </CardBody>
                    </Card>
                  ))}
                  {!profile.extracurricular?.length && (
                    <Empty
                      icon={Heart}
                      label="No activities added"
                      sub="Click Add Activity to get started"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Bottom breathing room so last card clears the sticky footer */}
            <div className="h-6" />
          </div>
        </ScrollArea>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:block">
            Changes are saved to your profile
          </p>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateCV.isPending}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-all text-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: BRAND,
                boxShadow: `0 4px 14px ${BRAND_ALPHA(0.35)}`,
              }}
              onMouseEnter={(e) =>
                !updateCV.isPending && (e.currentTarget.style.opacity = "0.85")
              }
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
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
