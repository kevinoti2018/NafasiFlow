import { AppSidebar } from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentUser } from "@/lib/utils/session";
import { redirect } from "next/navigation";
import NavHeader from "@/components/navigation/NavHeader";
import { ExtensionCleanup } from "@/components/ExtensionCleanup";

export default async function MyAccountLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  // Protect route
  if (!user) redirect("/login");

  // Ensure we stay in the user context
  if (user?.role !== "USER") redirect("/dashboard");
  const sections = [
    {
      label: "Core",
      items: [
        {
          title: "Dashboard",
          url: "/my-account",
          iconName: "LayoutDashboard",
        },
        {
          title: "Analysis",
          url: "/my-account/analysis",
          iconName: "BrainCircuit",
        },
      ],
    },
    {
      label: "CV & Jobs",
      items: [
        {
          title: "CVs",
          url: "/my-account/cv",
          iconName: "FileText",
        },
        {
          title: "Jobs",
          url: "/my-account/jobs",
          iconName: "Briefcase",
        },
        {
          title: "Templates",
          url: "/my-account/templates",
          iconName: "LayoutTemplate",
        },
      ],
    },
    {
      label: "Tracking",
      items: [
        {
          title: "Applications",
          url: "/my-account/applications",
          iconName: "ClipboardList",
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          title: "Settings",
          url: "/my-account/settings",
          iconName: "Settings2",
        },
      ],
    },
  ];

  return (
    <SidebarProvider>
      <ExtensionCleanup />
      <AppSidebar sections={sections} user={user} />
      <SidebarInset>
        <NavHeader />
        <main className="h-full w-full bg-slate-50/50 p-4 transition-colors duration-300 md:p-8 dark:bg-slate-950/20">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
