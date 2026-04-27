"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Trash2,
  AlertCircle,
  User,
  Lock,
  ShieldAlert,
  Save,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import {
  useUserProfile,
  useUpdateProfile,
  useChangePassword,
  useDeleteAccount,
} from "@/hooks/use-user";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const PASSWORD_MIN_LENGTH = 8;

export default function SettingsPage() {
  const { data, isLoading } = useUserProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (data?.user) {
      setProfileForm({
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        email: data.user.email || "",
      });
    }
  }, [data]);

  const validatePassword = useCallback((password: string, confirm: string) => {
    if (password !== confirm) {
      toast.error("New passwords do not match");
      return false;
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      toast.error(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      );
      return false;
    }
    return true;
  }, []);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync(profileForm);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !validatePassword(passwordForm.newPassword, passwordForm.confirmPassword)
    )
      return;

    await changePassword.mutateAsync({
      currentPassword: "",
      newPassword: passwordForm.newPassword,
    });
    resetPasswordForm();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !validatePassword(passwordForm.newPassword, passwordForm.confirmPassword)
    )
      return;

    await changePassword.mutateAsync({
      currentPassword,
      newPassword: passwordForm.newPassword,
    });
    resetPasswordForm();
    setCurrentPassword("");
  };

  const resetPasswordForm = useCallback(() => {
    setPasswordForm({ newPassword: "", confirmPassword: "" });
    setShowPassword(false);
  }, []);

  const handleDeleteAccount = async () => {
    await deleteAccount.mutateAsync();
    await signOut({ callbackUrl: "/login" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#005f78]" />
          <p className="text-sm text-muted-foreground">
            Loading your settings...
          </p>
        </div>
      </div>
    );
  }

  const isPasswordSet = data?.user?.isPasswordSet;

  const PasswordFields = ({
    showCurrent = false,
  }: {
    showCurrent?: boolean;
  }) => (
    <div className="space-y-4">
      {showCurrent && (
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-sm font-medium">
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="pr-10"
              placeholder="Enter your current password"
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="newPassword" className="text-sm font-medium">
          New Password
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPassword ? "text" : "password"}
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            className="pr-10"
            placeholder="Min. 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm New Password
        </Label>
        <Input
          id="confirmPassword"
          type={showPassword ? "text" : "password"}
          value={passwordForm.confirmPassword}
          onChange={(e) =>
            setPasswordForm((prev) => ({
              ...prev,
              confirmPassword: e.target.value,
            }))
          }
          placeholder="Re-enter new password"
        />
      </div>
    </div>
  );

  const tabItems = [
    { value: "profile", label: "Profile", icon: User },
    { value: "password", label: "Password", icon: Lock },
    { value: "danger", label: "Danger Zone", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#161b1d] py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile, security preferences, and account data
          </p>
        </div>

        <Card className="border shadow-sm dark:border-neutral-800">
          <CardContent className="p-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/* Custom Tab Navigation */}
              <div className="border-b px-6 pt-6 pb-0">
                <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-1 rounded-none">
                  {tabItems.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className={`
                          relative flex items-center gap-2 px-4 py-3 rounded-t-lg text-sm font-medium
                          data-[state=active]:bg-transparent data-[state=active]:shadow-none
                          data-[state=active]:text-[#005f78] dark:data-[state=active]:text-[#005f78]
                          text-muted-foreground hover:text-foreground transition-colors
                          border-b-2 border-transparent data-[state=active]:border-[#005f78]
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* Profile Tab */}
              <TabsContent value="profile" className="m-0 p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4">
                  <div className="h-10 w-10 rounded-full bg-[#005f78]/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-[#005f78]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      Personal Information
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Update your name and contact details
                    </p>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-sm font-medium"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={profileForm.firstName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={profileForm.lastName}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="h-10 pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={updateProfile.isPending}
                      className="bg-[#005f78] hover:bg-[#005f78]/90 text-white"
                    >
                      {updateProfile.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Password Tab */}
              <TabsContent value="password" className="m-0 p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4">
                  <div className="h-10 w-10 rounded-full bg-[#005f78]/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-[#005f78]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">
                      {isPasswordSet ? "Change Password" : "Set Password"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isPasswordSet
                        ? "Update your existing password"
                        : "Create a password for your account"}
                    </p>
                  </div>
                </div>

                {isPasswordSet ? (
                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <PasswordFields showCurrent />
                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={changePassword.isPending}
                        className="bg-[#005f78] hover:bg-[#005f78]/90 text-white"
                      >
                        {changePassword.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Update Password
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSetPassword} className="space-y-5">
                    <PasswordFields />
                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        disabled={changePassword.isPending}
                        className="bg-[#005f78] hover:bg-[#005f78]/90 text-white"
                      >
                        {changePassword.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Set Password
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              {/* Danger Zone Tab */}
              <TabsContent value="danger" className="m-0 p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                      Delete Account
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Permanently remove your account and all data
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        This action cannot be undone
                      </p>
                      <p className="text-sm text-red-700/80 dark:text-red-400/80 leading-relaxed">
                        Once deleted, your account and all associated data
                        including CVs, jobs, applications, templates, and
                        analyses will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Account"
        description="Are you absolutely sure? This action will permanently delete your account and all associated data (CVs, jobs, applications, templates, analyses). This cannot be undone."
        confirmLabel="Yes, delete my account"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAccount}
        isConfirming={deleteAccount.isPending}
      />
    </div>
  );
}
