import { SiteLayout } from "@/components/layout/SiteLayout";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteLayout>
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50 dark:bg-slate-950">
        {children}
      </div>
    </SiteLayout>
  );
}
