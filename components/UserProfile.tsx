"use client";

import {
  ChevronsUpDown,
  LogOut,
  Key,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NavUserProps = {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
};

export function NavUser({ user }: Readonly<NavUserProps>) {
  const { isMobile } = useSidebar();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="h-14 w-full rounded-2xl border border-transparent transition-all duration-300 hover:bg-muted data-[state=open]:border-border data-[state=open]:bg-muted"
            >
              <Avatar className="h-9 w-9 rounded-xl border-2 border-primary/20 shadow-sm">
                <AvatarImage
                  src={user?.image ?? undefined}
                  alt={user?.name ?? "User"}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-xl bg-primary/10 text-[10px] font-black tracking-tighter text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="ml-3 grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-[11px] font-black tracking-tight text-foreground uppercase">
                  {user?.name ?? "Anonymous User"}
                </span>
                <span className="truncate text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                  {user?.role || "Active Member"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-3.5 text-muted-foreground/60" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-[2rem] border-border bg-background/95 p-3 shadow-2xl backdrop-blur-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={12}
          >
            <DropdownMenuLabel className="p-3 font-normal">
              <div className="flex items-center gap-4 px-1 py-1 text-left">
                <Avatar className="h-12 w-12 rounded-2xl border-2 border-primary shadow-lg shadow-primary/20">
                  <AvatarImage
                    src={user?.image ?? undefined}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback className="rounded-2xl bg-primary font-black text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-black tracking-tighter uppercase text-foreground">
                    {user?.name ?? "User"}
                  </span>
                  <span className="truncate text-[11px] font-bold text-muted-foreground lowercase">
                    {user?.email ?? "No email provided"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-2 opacity-50" />

            <DropdownMenuGroup className="space-y-1">
              {[
                {
                  href: "/my-account/profile",
                  icon: UserIcon,
                  label: "Profile Hub",
                },
                {
                  href: "/my-account/profile/security",
                  icon: Key,
                  label: "Security",
                },
                {
                  href: "/my-account/settings",
                  icon: Settings,
                  label: "Preferences",
                },
              ].map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  asChild
                  className="group cursor-pointer rounded-xl transition-all duration-200 focus:bg-primary focus:text-primary-foreground"
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <item.icon className="size-4 opacity-70 group-focus:opacity-100" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                      {item.label}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="my-2 opacity-50" />

            <DropdownMenuItem
              onClick={() => signOut()}
              className="group cursor-pointer rounded-xl px-3 py-3 text-destructive transition-all duration-200 focus:bg-destructive focus:text-destructive-foreground"
            >
              <LogOut className="mr-3 size-4 group-focus:animate-out group-focus:slide-out-to-left-1" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase">
                Terminate Session
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
