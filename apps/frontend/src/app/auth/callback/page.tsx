"use client";

import { useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const token = searchParams.get("token");

    if (!token) {
      router.replace("/auth/login?error=Token tidak ditemukan");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = res.data;
        const role = data.role;

        const isMember = role === "member";
        const nama = isMember ? data.member?.nama_member : data.spaceOwner?.nama_coworking;

        setAuth({
          token,
          role,
          memberId: data.memberId,
          spaceOwnerId: data.spaceOwnerId,
          namaMember: nama || null,
        });

        if (role === "member") {
          router.replace("/");
        } else if (role === "admin_space") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/auth/login?error=Role tidak valid");
        }
      } catch (error) {
        router.replace("/auth/login?error=Gagal memuat profil atau token kadaluarsa");
      }
    };

    fetchProfile();
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone/20">
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-stone">
        <div className="w-10 h-10 border-4 border-[#EF6905] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-ink font-medium animate-pulse mt-2">Menyelesaikan login...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-stone/20">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-stone">
          <div className="w-10 h-10 border-4 border-[#EF6905] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-ink font-medium animate-pulse mt-2">Loading...</p>
        </div>
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
