"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/ui/auth-shell";
import { GoogleAuthButton } from "@/components/ui/google-auth-button";

const memberSchema = z.object({
  username: z
    .string()
    .min(3, "Minimum 3 characters")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Minimum 6 characters"),
  nama_member: z.string().min(1, "Full name is required"),
  instansi: z.string().optional(),
  alamat: z.string().min(1, "Address is required"),
  telp: z.string().min(8, "Invalid phone number"),
});

const adminSchema = z.object({
  username: z
    .string()
    .min(3, "Minimum 3 characters")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Minimum 6 characters"),
  namaCoworking: z.string().min(1, "Coworking name is required"),
  namaPemilik: z.string().min(1, "Owner name is required"),
  telp: z.string().min(8, "Invalid phone number"),
});

type MemberFormData = z.infer<typeof memberSchema>;
type AdminFormData = z.infer<typeof adminSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [role, setRole] = useState<"member" | "admin_space">("member");

  // Member Form
  const memberForm = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
  });

  // Admin Form
  const adminForm = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
  });

  const onSubmitMember = async (data: MemberFormData) => {
    setServerError(null);
    try {
      const res = await api.post("/auth/register/member", data);
      const email = res.data.email || data.email;
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Registration failed, please try again.");
    }
  };

  const onSubmitAdmin = async (data: AdminFormData) => {
    setServerError(null);
    try {
      const res = await api.post("/auth/register/admin-space", data);
      const email = res.data.email || data.email;
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Registration failed, please try again.");
    }
  };

  return (
    <AuthShell>
      <h1 className="font-display text-2xl font-semibold text-ink text-center mb-6">
        Create a SpotSpace account
      </h1>

      <div className="flex justify-center mb-8 bg-stone/20 p-1 rounded-lg">
        <button
          onClick={() => setRole("member")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === "member" ? "bg-white text-ink shadow-sm" : "text-ink hover:text-ink"}`}
        >
          Member
        </button>
        <button
          onClick={() => setRole("admin_space")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${role === "admin_space" ? "bg-white text-ink shadow-sm" : "text-ink hover:text-ink"}`}
        >
          Space Admin
        </button>
      </div>

      <GoogleAuthButton role={role} />

      <div className="flex items-center gap-4 my-6">
        <div className="h-px flex-1 bg-stone" />
        <span className="text-sm text-ink">or</span>
        <div className="h-px flex-1 bg-stone" />
      </div>

      {role === "member" ? (
        <form onSubmit={memberForm.handleSubmit(onSubmitMember)} className="space-y-4">
          <div>
            <Input placeholder="Full name" {...memberForm.register("nama_member")} />
            {memberForm.formState.errors.nama_member && <p className="text-sm text-status-cancelled mt-1">{memberForm.formState.errors.nama_member.message}</p>}
          </div>
          <div>
            <Input placeholder="Username (e.g. johndoe)" {...memberForm.register("username")} />
            {memberForm.formState.errors.username && <p className="text-sm text-status-cancelled mt-1">{memberForm.formState.errors.username.message}</p>}
          </div>
          <div>
            <Input type="email" placeholder="Email address" {...memberForm.register("email")} />
            {memberForm.formState.errors.email && <p className="text-sm text-status-cancelled mt-1">{memberForm.formState.errors.email.message}</p>}
          </div>
          <Input placeholder="Company/Institution (optional)" {...memberForm.register("instansi")} />
          <div>
            <Input placeholder="Address" {...memberForm.register("alamat")} />
            {memberForm.formState.errors.alamat && <p className="text-sm text-status-cancelled mt-1">{memberForm.formState.errors.alamat.message}</p>}
          </div>
          <div>
            <Input placeholder="Phone number" {...memberForm.register("telp")} />
            {memberForm.formState.errors.telp && <p className="text-sm text-status-cancelled mt-1">{memberForm.formState.errors.telp.message}</p>}
          </div>
          <div>
            <Input type="password" placeholder="Password" {...memberForm.register("password")} />
            {memberForm.formState.errors.password && <p className="text-sm text-status-cancelled mt-1">{memberForm.formState.errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-status-cancelled">{serverError}</p>}

          <Button type="submit" disabled={memberForm.formState.isSubmitting} className="w-full bg-[#EF6905] hover:bg-[#EF6905]/90 py-6 text-base font-semibold mt-4">
            {memberForm.formState.isSubmitting ? "Processing..." : "Sign up"}
          </Button>
        </form>
      ) : (
        <form onSubmit={adminForm.handleSubmit(onSubmitAdmin)} className="space-y-4">
          <div>
            <Input placeholder="Coworking Name" {...adminForm.register("namaCoworking")} />
            {adminForm.formState.errors.namaCoworking && <p className="text-sm text-status-cancelled mt-1">{adminForm.formState.errors.namaCoworking.message}</p>}
          </div>
          <div>
            <Input placeholder="Owner Name" {...adminForm.register("namaPemilik")} />
            {adminForm.formState.errors.namaPemilik && <p className="text-sm text-status-cancelled mt-1">{adminForm.formState.errors.namaPemilik.message}</p>}
          </div>
          <div>
            <Input placeholder="Phone number" {...adminForm.register("telp")} />
            {adminForm.formState.errors.telp && <p className="text-sm text-status-cancelled mt-1">{adminForm.formState.errors.telp.message}</p>}
          </div>
          <div>
            <Input placeholder="Username (e.g. admin_nakoa)" {...adminForm.register("username")} />
            {adminForm.formState.errors.username && <p className="text-sm text-status-cancelled mt-1">{adminForm.formState.errors.username.message}</p>}
          </div>
          <div>
            <Input type="email" placeholder="Email address" {...adminForm.register("email")} />
            {adminForm.formState.errors.email && <p className="text-sm text-status-cancelled mt-1">{adminForm.formState.errors.email.message}</p>}
          </div>
          <div>
            <Input type="password" placeholder="Password" {...adminForm.register("password")} />
            {adminForm.formState.errors.password && <p className="text-sm text-status-cancelled mt-1">{adminForm.formState.errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-status-cancelled">{serverError}</p>}

          <Button type="submit" disabled={adminForm.formState.isSubmitting} className="w-full bg-[#EF6905] hover:bg-[#EF6905]/90 py-6 text-base font-semibold mt-4">
            {adminForm.formState.isSubmitting ? "Processing..." : "Sign up as Admin"}
          </Button>
        </form>
      )}

      <p className="text-[13px] text-ink mt-4 text-center">
        By clicking Sign up, you agree to <a href="https://www.spotspace.my.id/legal/terms" className="text-[#EF6905] hover:underline" target="_blank" rel="noreferrer">SpotSpace&apos;s Services Agreement</a> and <a href="https://www.spotspace.my.id/legal/privacy" className="text-[#EF6905] hover:underline" target="_blank" rel="noreferrer">Privacy Policy</a>.
      </p>

      <p className="text-sm text-ink text-center mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-[#EF6905] font-medium hover:underline hover:text-[#EF6905]/80">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}