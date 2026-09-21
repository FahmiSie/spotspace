"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/ui/auth-shell";
import { toast } from "@/components/ui/toast";
import { CheckCircle2, Mail, Loader2 } from "lucide-react";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verified, setVerified] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = useCallback(async () => {
    if (!email || code.length !== 6) return;
    setIsVerifying(true);
    try {
      await api.post("/auth/verify-account-otp", { email, code });
      setVerified(true);
      (toast as any).add({ title: "Account verified successfully!", type: "success" });
      setTimeout(() => {
        router.push(`/auth/login?success=${encodeURIComponent("Account verified! You can now log in.")}&email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Verification failed. Please try again.";
      (toast as any).add({ title: msg, type: "error" });
    } finally {
      setIsVerifying(false);
    }
  }, [email, code, router]);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    try {
      await api.post("/auth/resend-account-otp", { email });
      (toast as any).add({ title: "A new verification code has been sent to your email.", type: "success" });
      setCountdown(60);
      setCanResend(false);
      setCode("");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to resend code.";
      (toast as any).add({ title: msg, type: "error" });
    } finally {
      setIsResending(false);
    }
  };

  if (verified) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-ink mb-2">Account Verified!</h2>
          <p className="text-ink text-sm">Redirecting you to the login page...</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-14 h-14 bg-[#EF6905]/10 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-[#EF6905]" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">
          Verify your account
        </h1>
        <p className="text-sm text-ink max-w-sm">
          We sent a 6-digit verification code to{" "}
          {email ? (
            <span className="font-medium text-[#EF6905]">{email}</span>
          ) : (
            "your email"
          )}
          . Enter the code below to activate your account.
        </p>
      </div>

      <div className="space-y-6">
        {!emailParam && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ink mb-2 block">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-ink mb-2 block">
            Verification Code
          </label>
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(val);
            }}
            className="text-center text-2xl font-mono tracking-[0.5em] py-4 h-14"
            autoFocus
          />
        </div>

        <Button
          onClick={handleVerify}
          disabled={isVerifying || code.length !== 6 || !email}
          className="w-full bg-[#EF6905] hover:bg-[#EF6905]/90 py-6 text-base font-semibold"
        >
          {isVerifying ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </span>
          ) : (
            "Verify & Activate Account"
          )}
        </Button>

        <div className="text-center pt-2">
          {canResend ? (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-sm text-[#EF6905] font-medium hover:underline disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          ) : (
            <p className="text-sm text-ink">
              Resend code in{" "}
              <span className="font-mono font-medium text-[#EF6905]">{countdown}s</span>
            </p>
          )}
        </div>

        <p className="text-xs text-ink text-center">
          Didn&apos;t receive the email? Check your spam folder, or{" "}
          <button
            onClick={handleResend}
            disabled={!canResend || isResending}
            className="text-[#EF6905] font-medium hover:underline disabled:opacity-50"
          >
            click here to resend
          </button>
          .
        </p>
      </div>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-[#EF6905] border-t-transparent rounded-full animate-spin" />
          </div>
        </AuthShell>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
