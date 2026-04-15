"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  CheckCircle,
  Sparkles,
  Target,
  Zap,
  ArrowRight,
} from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";

export default function LandingPage() {
  return (
    <SiteLayout>
      <div className="bg-background text-foreground">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden px-6 py-24 lg:py-32">
          {/* Subtle Primary Glow */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_50%,rgba(var(--primary),0.08)_0%,transparent_100%)]" />

          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-bold text-primary">
              <Sparkles size={16} />
              <span>Phase 1 Engine Now Live</span>
            </div>

            <h1 className="mt-8 text-5xl font-black tracking-tighter md:text-7xl">
              Land More Interviews with{" "}
              <span className="text-primary">AI-Powered</span> CV Optimization
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Analyze your CV against any job, bridge the gaps, and generate
              tailored resumes that beat the ATS—all in one mechanical,
              distraction-free tracker.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-14 rounded-full px-8 text-base font-bold shadow-xl shadow-primary/20"
                >
                  Get Started Free
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 rounded-full px-8 text-base font-bold"
                >
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* PAIN POINTS */}
        <section className="border-y border-border/50 bg-muted/30 py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  The Problem with Modern Job Hunting
                </h2>
                <p className="mt-4 text-muted-foreground">
                  The ATS (Applicant Tracking System) is a wall. If your CV
                  isn't mathematically aligned to the JD, you never stand a
                  chance.
                </p>
              </div>
              <ul className="space-y-4">
                {[
                  "Vague JD requirements that hide what recruiters want",
                  "Manually tailoring CVs takes hours, not minutes",
                  "Losing track of which CV version was sent where",
                  "No objective score of how well you match a role",
                ].map((text, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm font-medium"
                  >
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <span className="text-[10px] font-bold">✕</span>
                    </div>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES */}
        <section id="how-it-works" className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-primary">
                The Career Engine
              </h2>
              <p className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                Engineered for Execution
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Target,
                  title: "Deep JD Analysis",
                  desc: "Paste a job description and let Gemini extract core competencies and hidden gaps in your current CV.",
                },
                {
                  icon: Brain,
                  title: "AI CV Optimization",
                  desc: "Improve your existing content while keeping your professional identity. Better presentation, zero hallucination.",
                },
                {
                  icon: Zap,
                  title: "Template Generation",
                  desc: "Instantly output optimized CVs as PDFs using real professional templates linked to your history.",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className="border-border/50 bg-muted/20 backdrop-blur-sm"
                >
                  <CardContent className="p-8">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <feature.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* TRACKER PREVIEW */}
        <section className="bg-primary py-24 text-primary-foreground">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-16 md:grid-cols-2">
              <div className="space-y-6">
                <h2 className="text-4xl font-black tracking-tight">
                  Stay Organized. Protect Your Streak.
                </h2>
                <p className="text-lg opacity-90">
                  Stop using spreadsheets. Our integrated tracker links every CV
                  version and match score to a specific application timeline.
                </p>
                <ul className="space-y-3">
                  {[
                    "Visual Status Tracking (Applied → Interviewing → Offered)",
                    "Snapshots of AI insights at application time",
                    "One-click access to the exact CV used",
                    "Automated match scoring before you apply",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 font-bold">
                      <CheckCircle className="shrink-0" size={20} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl md:p-8">
                <div className="space-y-4">
                  <div className="h-4 w-1/3 rounded bg-white/20" />
                  <div className="space-y-2">
                    <div className="h-8 w-full rounded bg-white/40" />
                    <div className="h-8 w-full rounded bg-white/40" />
                    <div className="h-8 w-3/4 rounded bg-white/40" />
                  </div>
                  <div className="h-10 w-24 rounded-full bg-primary-foreground text-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-muted/50 p-12 backdrop-blur-md">
            <h2 className="text-4xl font-black tracking-tight">
              Ready to Optimize?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join the high-performers tracking their career growth through
              consistency and data.
            </p>
            <div className="mt-10">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-14 w-full rounded-full px-12 text-lg font-bold sm:w-auto"
                >
                  Start Phase 1 Now
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Built for execution • No dark patterns
            </p>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
