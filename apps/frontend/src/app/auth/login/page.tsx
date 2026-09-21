"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/ui/auth-shell";
import { GoogleAuthButton } from "@/components/ui/google-auth-button";
import { CheckCircle2, AlertTriangle } from "lucide-react";

const schema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState<string | null>(null);

  const successMsg = searchParams.get("success");
  const defaultIdentifier = searchParams.get("username") || searchParams.get("email") || "";

  const { register, handleSubmit, formState: { errors, isSubmitting }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      identifier: defaultIdentifier,
    }
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setNeedsVerification(null);
    try {
      const res = await api.post("/auth/login", data);
      setAuth({
        token: res.data.accessToken,
        role: res.data.role,
        memberId: res.data.member?.id ?? null,
        spaceOwnerId: res.data.spaceOwner?.id ?? null,
        namaMember: res.data.member?.namaMember ?? null,
      });
      router.push(res.data.role === "admin_space" ? "/admin/dashboard" : "/");
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message || "Invalid email/username or password.";

      if (status === 403) {
        // Account not verified — offer link to verify OTP
        setNeedsVerification(data.identifier);
        setServerError(null);
      } else {
        setServerError(message);
        setNeedsVerification(null);
      }
    }
  };

  return (
    <AuthShell>
      {successMsg && (
        <div className="mb-6 p-4 bg-status-success/10 border border-status-success/20 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
          <p className="text-sm text-status-success font-medium">{successMsg}</p>
        </div>
      )}

      <h1 className="font-display text-2xl font-semibold text-ink text-center mb-8">
        Log in to SpotSpace
      </h1>

      <GoogleAuthButton role="member" />

      <div className="flex items-center gap-4 my-6">
        <div className="h-px flex-1 bg-stone" />
        <span className="text-sm text-ink">or</span>
        <div className="h-px flex-1 bg-stone" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input placeholder="Email or Username" {...register("identifier")} />
          {errors.identifier && <p className="text-sm text-status-cancelled mt-1">{errors.identifier.message}</p>}
        </div>
        <div>
          <Input type="password" placeholder="Password" {...register("password")} />
          {errors.password && <p className="text-sm text-status-cancelled mt-1">{errors.password.message}</p>}
        </div>

        {serverError && <p className="text-sm text-status-cancelled">{serverError}</p>}

        {needsVerification && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Account not verified</p>
              <p>Please verify your account via OTP first.</p>
              <Link
                href={`/auth/verify-otp?email=${encodeURIComponent(needsVerification)}`}
                className="inline-block mt-2 text-[#EF6905] font-medium hover:underline"
              >
                Go to verification page →
              </Link>
            </div>
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full bg-[#EF6905] hover:bg-[#EF6905]/90 py-6 text-base font-semibold mt-4">
          {isSubmitting ? "Processing..." : "Log in"}
        </Button>
      </form>

      <p className="text-sm text-ink text-center mt-8">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-[#EF6905] font-medium hover:underline hover:text-[#EF6905]/80">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthShell><div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-[#EF6905] border-t-transparent rounded-full animate-spin"></div></div></AuthShell>}>
      <LoginForm />
    </Suspense>
  );
}