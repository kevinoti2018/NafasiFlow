"use client";

import { Suspense } from "react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import {
  Mail,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AuthService } from "@/services/AuthService";
import { toast } from "sonner";

const VerifyRequestContent = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const { mutate: resendEmail, isPending } = useMutation({
    mutationKey: ["resendVerification"],
    mutationFn: (targetEmail: string) =>
      AuthService.resendVerification(targetEmail),
    onSuccess: (data) => {
      toast.success("Link Dispatched", {
        description:
          data.message || "A fresh activation link is in your inbox.",
      });
    },
    onError: (error: Error) => {
      toast.error("Dispatch Failed", {
        description: error.message,
      });
    },
  });

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 border border-rose-100 dark:border-rose-900/30 p-8 rounded-3xl shadow-xl text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Missing Context
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We couldn&apos;t identify the email address associated with this
              request.
            </p>
            <Link href="/register" className="block">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6 font-bold shadow-lg shadow-emerald-500/10 transition-all">
                Return to Registration
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-slate-200/60 dark:border-white/5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="text-center pb-4 pt-10">
            <div className="mx-auto mb-6 w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl animate-ping opacity-20" />
              <Mail className="w-10 h-10 text-emerald-600 dark:text-emerald-400 relative z-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
              Check Your Inbox
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              A link has been sent to <br />
              <span className="font-semibold text-emerald-600 underline underline-offset-4 decoration-emerald-500/30">
                {email}
              </span>
            </p>
          </CardHeader>

          <CardContent className="space-y-8 px-8 pb-10">
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/20">
                <CheckCircle className="w-6 h-6 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-emerald-900 dark:text-emerald-300">
                    Initialize Momentum
                  </p>
                  <p className="text-emerald-700/80 dark:text-emerald-400/70 mt-1 leading-relaxed">
                    Click the link in your email to activate your identity and
                    start building your career engine.
                  </p>
                </div>
              </div>

              <div className="text-center space-y-5">
                <p className="text-sm text-slate-400 px-4">
                  Didn&apos;t see it? Check your spam folder or request a new
                  one below.
                </p>

                <Button
                  disabled={isPending}
                  onClick={() => resendEmail(email)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 rounded-2xl transition-all flex items-center justify-center w-full shadow-lg shadow-emerald-500/20 group font-bold"
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 transition-transform duration-700 ${
                      isPending ? "animate-spin" : "group-hover:rotate-180"
                    }`}
                  />
                  {isPending ? "Dispatching..." : "Resend Activation Email"}
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-400 uppercase tracking-[0.2em] font-semibold">
          Consistency &bull; Career Engine
        </p>
      </div>
    </div>
  );
};

// Main Page Export with Suspense
const VerifyRequestPage = () => {
  return (
    <SiteLayout>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        }
      >
        <VerifyRequestContent />
      </Suspense>
    </SiteLayout>
  );
};

export default VerifyRequestPage;
