"use client";

import { useState, useRef, useEffect } from "react";
import { useAdminProfile, useUpdateAdminProfile, useAdminSpaces } from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Camera, ShieldCheck, MapPin, Building, CheckCircle2, Search, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { uploadFile } from "@/lib/api";
import { getAssetUrl } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  nama_coworking: z.string().min(2, "Must be at least 2 characters"),
  nama_pemilik: z.string().min(2, "Must be at least 2 characters"),
  telp: z.string().min(9, "Invalid phone number"),
  deskripsi: z.string().optional(),
  alamat: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AdminProfilePage() {
  const { data: profile, isLoading, error } = useAdminProfile();
  const { data: spaces } = useAdminSpaces();
  const updateProfile = useUpdateAdminProfile();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nama_coworking: "",
      nama_pemilik: "",
      telp: "",
      deskripsi: "",
      alamat: "",
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        nama_coworking: profile.namaCoworking || "",
        nama_pemilik: profile.namaPemilik || "",
        telp: profile.telp || "",
        deskripsi: profile.deskripsi || "",
        alamat: profile.alamat || "",
      });
    }
  }, [profile, reset]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const loadingToastId = (toast as any).add({ title: "Uploading profile photo...", type: "loading" });

      const res = await uploadFile(file);
      (toast as any).update(loadingToastId, { title: "Photo uploaded, saving...", type: "loading" });

      if (res.url) {
        const payload: Record<string, any> = {
          nama_coworking: profile?.namaCoworking || "-",
          nama_pemilik: profile?.namaPemilik || "-",
          telp: profile?.telp || "-",
          deskripsi: profile?.deskripsi || "",
          alamat: profile?.alamat || "",
          foto: res.url,
        };

        await updateProfile.mutateAsync(payload);
        queryClient.invalidateQueries({ queryKey: ["admin", "profile"] });
        (toast as any).update(loadingToastId, { title: "Profile photo updated successfully", type: "success" });
      }
    } catch (err: any) {
      (toast as any).add({ title: "Upload Failed", description: err.message, type: "error" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const loadingToastId = (toast as any).add({ title: "Saving changes...", type: "loading" });
      await updateProfile.mutateAsync({
        ...data,
        foto: profile?.foto || null,
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "profile"] });
      (toast as any).update(loadingToastId, { title: "Profile updated successfully!", type: "success" });
      reset(data); // reset form dirty state with new values
    } catch (err: any) {
      (toast as any).add({ title: "Update Failed", description: err.message, type: "error" });
    }
  };

  const formAlamat = watch("alamat");
  
  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
        <Skeleton className="w-full h-48 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-1 space-y-6">
            <Skeleton className="w-full h-[400px] rounded-2xl" />
          </div>
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <Skeleton className="w-full h-64 rounded-2xl" />
            <Skeleton className="w-full h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto text-center py-20">
        <div className="w-16 h-16 bg-[#FCE8E6] rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-[#C5221F]" />
        </div>
        <h2 className="text-xl font-bold text-[#0B0909]">Failed to load profile</h2>
        <p className="text-[#0B0909] mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  const spaceCount = spaces?.length || 0;
  const activeSpaces = spaces?.length || 0;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0B0909]">Profile</h1>
          <p className="text-[#0B0909] text-sm mt-1">Manage your coworking identity, contact details, and location.</p>
        </div>
        <Button 
          onClick={handleSubmit(onSubmit)} 
          disabled={!isDirty || updateProfile.isPending}
          className="bg-[#0B0909] hover:bg-[#0B0909]/90 text-white min-w-[140px] rounded-lg shadow-sm"
        >
          {updateProfile.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Kolom Kiri: Visual Identity */}
        <div className="col-span-1 xl:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm relative">
            {/* Cover Gradient */}
            <div className="h-32 bg-gradient-to-br from-[#0B0909] via-[#2A2A2A] to-[#EF6905] opacity-90"></div>
            
            <div className="px-6 pb-6 relative">
              {/* Avatar */}
              <div className="relative -mt-12 mb-4 w-fit">
                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-sm border border-[#E5E5E5]">
                  <div className="w-full h-full rounded-xl bg-[#FAFAFA] flex items-center justify-center text-[#0B0909] overflow-hidden relative">
                    {profile.foto ? (
                      <img src={getAssetUrl(profile.foto)} alt="Avatar" className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : ''}`} />
                    ) : (
                      <Building2 className={`w-10 h-10 ${isUploading ? 'opacity-50' : ''}`} />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-[#E5E5E5] rounded-full flex items-center justify-center text-[#0B0909] shadow-sm hover:bg-[#FAFAFA] transition-colors disabled:opacity-50 z-10"
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
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-[#0B0909] truncate">{profile.namaCoworking || "Coworking Name"}</h2>
                  <ShieldCheck className="w-5 h-5 text-[#137333]" />
                </div>
                <p className="text-sm font-medium text-[#137333] bg-[#E6F4EA] px-2 py-0.5 rounded-md inline-block mb-6">Verified Owner</p>
                
                <div className="space-y-4 pt-4 border-t border-[#E5E5E5]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#0B0909]">
                      <Building className="w-4 h-4" />
                      <span className="text-sm font-medium">Registered Spaces</span>
                    </div>
                    <span className="font-semibold text-[#0B0909] font-mono">{spaceCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#0B0909]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Active Spaces</span>
                    </div>
                    <span className="font-semibold text-[#137333] font-mono">{activeSpaces}</span>
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
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
              <h3 className="text-lg font-semibold text-[#0B0909] mb-4">Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0B0909] uppercase tracking-wider">Coworking Name</label>
                  <Input {...register("nama_coworking")} placeholder="e.g. SpotSpace Hub" className="bg-white border-[#E5E5E5] h-11" />
                  {errors.nama_coworking && <p className="text-xs text-[#C5221F]">{errors.nama_coworking.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0B0909] uppercase tracking-wider">Owner Name</label>
                  <Input {...register("nama_pemilik")} placeholder="e.g. John Doe" className="bg-white border-[#E5E5E5] h-11" />
                  {errors.nama_pemilik && <p className="text-xs text-[#C5221F]">{errors.nama_pemilik.message}</p>}
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-[#0B0909] uppercase tracking-wider">Description</label>
                  <textarea 
                    {...register("deskripsi")} 
                    placeholder="Tell us about your coworking space..." 
                    rows={4}
                    className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#0B0909] outline-none focus:border-[#EF6905] transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Contact & Location */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm">
              <h3 className="text-lg font-semibold text-[#0B0909] mb-4">Contact & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0B0909] uppercase tracking-wider">Operational Phone Number</label>
                  <Input {...register("telp")} placeholder="e.g. 081234567890" className="bg-white border-[#E5E5E5] h-11 w-full" />
                  {errors.telp && <p className="text-xs text-[#C5221F]">{errors.telp.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#0B0909] uppercase tracking-wider">Admin Email Address</label>
                  <div className="relative">
                    <Input 
                      type="email"
                      value={(profile.user as any)?.email || ''} 
                      readOnly
                      disabled
                      placeholder="No email connected"
                      className="w-full bg-[#FAFAFA] text-[#808080] cursor-not-allowed border-[#E5E5E5] h-11 pr-10 focus-visible:ring-0" 
                    />
                    <Lock className="w-4 h-4 text-[#808080] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-[#808080] mt-1">Email address is linked to your admin login.</p>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="block text-xs font-bold text-[#0B0909] uppercase tracking-wider">Location / Google Maps Plus Code</label>
                  <p className="text-[#0B0909] text-xs mb-2">
                    Open Google Maps, find your space location, then click 'Copy Plus Code' and paste it here.
                  </p>
                  <textarea 
                    {...register("alamat")} 
                    placeholder="e.g. 2JMC+M3 Oro-oro Dowo, Kota Malang, Jawa Timur" 
                    rows={2}
                    className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#0B0909] outline-none focus:border-[#EF6905] transition-colors resize-none"
                  />
                  
                  {formAlamat && (
                    <div className="w-full h-64 rounded-xl overflow-hidden border border-[#E5E5E5] mt-4">
                      <iframe
                        title="Location Preview"
                        width="100%"
                        height="100%"
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(formAlamat)}&z=16&output=embed`}
                        className="w-full h-full"
                        loading="lazy"
                        frameBorder="0"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

