"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "@/components/ui/toast";
import { useMyProfile, useUpdateProfile, useUpdateProfileFoto } from "@/lib/hooks/use-profile";
import { useMyReservasi } from "@/lib/hooks/use-reservasi";
import { uploadFile } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Camera, ShieldCheck, CheckCircle2, Lock, CalendarCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  occupation: z.string().optional(),
  phone: z.string().min(9, "Invalid phone number").optional().or(z.literal("")),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: profile, isLoading, error } = useMyProfile();
  const { data: reservations } = useMyReservasi();
  const updateProfile = useUpdateProfile();
  const updateFoto = useUpdateProfileFoto();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      occupation: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.namaMember || "",
        occupation: profile.instansi || "",
        phone: profile.telp === '-' ? "" : profile.telp || "",
      });
    }
  }, [profile, reset]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { url } = await uploadFile(file);
      await updateFoto.mutateAsync({ foto: url });
      (toast as any).add({ title: "Profile photo updated", type: "success" });
    } catch (err: any) {
      (toast as any).add({ title: "Upload failed", description: err.message, type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync(data);
      (toast as any).add({ title: "Profile updated successfully!", type: "success" });
      reset(data);
    } catch (err: any) {
      // toast already handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Skeleton className="w-48 h-10 mb-12" />
          <Skeleton className="w-full h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-16 px-6 text-center text-red-600">
        Failed to load profile.
      </div>
    );
  }

  const totalReservations = reservations?.length || 0;
  const activeBookings = reservations?.filter(r => r.status === "aktif" || r.status === "disetujui" || r.status === "belum_dikonfirm" || (r.status as string) === "menunggu_persetujuan").length || 0;

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">Profile</h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">Manage your personal details, contact information, and identity.</p>
          </div>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={!isDirty || updateProfile.isPending}
            className="px-5 py-2 bg-stone-500 hover:bg-stone-600 text-white text-xs font-semibold rounded-md shadow-sm transition disabled:opacity-50"
          >
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Kolom Kiri: Visual Identity */}
          <div className="col-span-1 xl:col-span-1 space-y-6">
            <div className="bg-white rounded-lg border border-stone-200 overflow-hidden shadow-sm">
              {/* Cover Gradient */}
              <div className="h-28 w-full bg-gradient-to-r from-stone-800 via-stone-700 to-orange-700 relative"></div>
              
              <div className="px-6 pb-6 relative">
                {/* Avatar */}
                <div className="-mt-12 ml-6 relative inline-block">
                  {profile.foto ? (
                    <img src={getAssetUrl(profile.foto)} alt={profile.namaMember} className={`w-20 h-20 rounded-xl border-4 border-white shadow-md object-cover bg-stone-100 ${isUploading ? 'opacity-50' : ''}`} />
                  ) : (
                    <div className={`w-20 h-20 rounded-xl border-4 border-white shadow-md bg-stone-100 flex items-center justify-center text-stone-300 ${isUploading ? 'opacity-50' : ''}`}>
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl border-4 border-white">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute -bottom-1 -right-1 p-1 bg-white rounded-md border border-stone-200 shadow-sm hover:bg-stone-50 text-stone-600 disabled:opacity-50 z-10"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    accept="image/png, image/jpeg, image/webp" 
                    className="hidden" 
                  />
                </div>

                {/* Profile Overview */}
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <h2 className="font-bold text-base text-stone-900 truncate">{profile.namaMember || "Member Name"}</h2>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">Verified Member</span>
                  
                  <div className="border-t border-stone-100 mt-6 pt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-3.5 h-3.5 text-stone-400" />
                        <span>Total Reservations</span>
                      </div>
                      <span className="font-semibold text-stone-900">{totalReservations}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
                        <span>Active Bookings</span>
                      </div>
                      <span className="font-semibold text-stone-900">{activeBookings}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Modular Form Cards */}
          <div className="col-span-1 xl:col-span-2 space-y-6">
            <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Card 1: Basic Info */}
              <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-stone-900">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">FULL NAME</label>
                    <Input {...register("name")} placeholder="e.g. John Doe" className="w-full px-3 py-2 text-xs text-stone-800 bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 transition" />
                    {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">OCCUPATION / INSTITUTION</label>
                    <Input {...register("occupation")} placeholder="e.g. Software Engineer" className="w-full px-3 py-2 text-xs text-stone-800 bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 transition" />
                    {errors.occupation && <p className="text-[11px] text-red-600 mt-1">{errors.occupation.message}</p>}
                  </div>
                </div>
              </div>

              {/* Card 2: Contact Details */}
              <div className="bg-white rounded-lg border border-stone-200 p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-stone-900">Contact Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">PHONE NUMBER</label>
                    <Input {...register("phone")} placeholder="e.g. 081234567890" className="w-full px-3 py-2 text-xs text-stone-800 bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-stone-400 transition" />
                    {errors.phone && <p className="text-[11px] text-red-600 mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">EMAIL ADDRESS</label>
                    <div className="relative">
                      <Input 
                        type="email"
                        value={(profile.user as any)?.email || ''} 
                        readOnly
                        disabled
                        placeholder="No email connected"
                        className="w-full px-3 py-2 text-xs bg-stone-50 text-stone-400 cursor-not-allowed border border-stone-200 rounded-md focus:outline-none pr-10" 
                      />
                      <Lock className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">Email address is linked to your login and cannot be changed.</p>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
