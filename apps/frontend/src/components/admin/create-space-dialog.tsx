"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { uploadFiles } from "@/lib/api";
import { useCreateSpace, useAddSpaceFoto } from "@/lib/hooks/use-admin";
import { toast } from "@/components/ui/toast";

const spaceSchema = z.object({
  nama_space: z.string().min(2, "Name must be at least 2 characters"),
  harga_per_jam: z.number().min(1, "Price must be > 0"),
  tipe: z.enum(["desk", "meeting_room", "private_office"]),
  kapasitas: z.number().min(1, "Capacity min 1"),
  deskripsi: z.string().optional(),
});

type SpaceFormValues = z.infer<typeof spaceSchema>;

interface CreateSpaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSpaceDialog({ open, onOpenChange }: CreateSpaceDialogProps) {
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createMut = useCreateSpace();
  const addFotoMut = useAddSpaceFoto();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SpaceFormValues>({
    resolver: zodResolver(spaceSchema),
    defaultValues: {
      tipe: "desk",
      harga_per_jam: 50000,
      kapasitas: 1,
    }
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setPhotos([]);
    }
    onOpenChange(isOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setPhotos(prev => [...prev, ...newFiles]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: SpaceFormValues) => {
    try {
      setIsUploading(true);
      let coverUrl: string | undefined = undefined;
      const galleryUrls: string[] = [];

      let loadingToastId: string | undefined;

      if (photos.length > 0) {
        loadingToastId = (toast as any).add({ title: "Uploading images...", type: "loading" });
        const filesToUpload = photos.map(p => p.file);
        const uploadRes = await uploadFiles(filesToUpload);

        const uploadedUrls = uploadRes.urls || [];
        if (uploadedUrls.length > 0) {
          coverUrl = uploadedUrls[0];
          galleryUrls.push(...uploadedUrls.slice(1));
        }
        if (loadingToastId) (toast as any).update(loadingToastId, { title: "Images uploaded, saving space...", type: "loading" });
      }

      const newSpace = await createMut.mutateAsync({
        ...data,
        foto: coverUrl
      });

      if (galleryUrls.length > 0 && newSpace?.id) {
        await Promise.all(
          galleryUrls.map(url => addFotoMut.mutateAsync({ spaceId: newSpace.id, url }))
        );
      }

      if (loadingToastId) (toast as any).close(loadingToastId);
      handleOpenChange(false);
      (toast as any).add({ title: "Space created successfully", type: "success" });
    } catch (error: any) {
      console.error("Failed to create space:", error);
      if (error.message?.includes("Upload failed") || !error.response) {
         (toast as any).add({ title: "Upload Failed", description: error.message || "Failed to upload images", type: "error" });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const isLoading = isUploading || createMut.isPending || addFotoMut.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-[#E5E5E5] bg-[#FAFAFA] backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#0B0909]">Add New Space</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold text-[#0B0909] uppercase tracking-wider">
                Space Photos
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-8 bg-white border-[#E5E5E5] text-[#0B0909] hover:bg-[#E5E5E5]/50"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Photo
              </Button>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple 
              accept="image/png, image/jpeg, image/webp" 
              className="hidden" 
            />

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div 
                    key={index} 
                    className={`relative group rounded-xl overflow-hidden bg-white border border-[#E5E5E5] ${
                      index === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto md:h-[250px] border-2 border-[#EF6905]" : "aspect-square"
                    }`}
                  >
                    <img 
                      src={photo.url} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[#0B0909] text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        MAIN COVER
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-white/90 text-[#0B0909] hover:bg-white hover:text-[#B0523A] rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-[#E5E5E5] rounded-xl bg-white hover:bg-[#E5E5E5]/20 transition-colors flex flex-col items-center justify-center cursor-pointer text-[#0B0909]"
              >
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <p className="font-medium text-sm">Click to browse photos</p>
                <p className="text-xs mt-1">Supports JPG, PNG, WEBP (Max 5MB)</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nama_space" className="text-xs font-bold text-[#0B0909] uppercase tracking-wider">Space Name</Label>
              <Input id="nama_space" {...register("nama_space")} placeholder="Meeting Room A" className="bg-white border-[#E5E5E5]" />
              {errors.nama_space && <p className="text-xs text-[#B0523A]">{errors.nama_space.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tipe" className="text-xs font-bold text-[#0B0909] uppercase tracking-wider">Type</Label>
              <select
                id="tipe"
                {...register("tipe")}
                className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-[#0B0909] outline-none focus:border-[#EF6905] transition-colors"
              >
                <option value="desk">Personal Desk</option>
                <option value="meeting_room">Meeting Room</option>
                <option value="private_office">Private Office</option>
              </select>
              {errors.tipe && <p className="text-xs text-[#B0523A]">{errors.tipe.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="harga_per_jam" className="text-xs font-bold text-[#0B0909] uppercase tracking-wider">Price Per Hour (IDR)</Label>
              <Input id="harga_per_jam" type="number" step="any" {...register("harga_per_jam", { valueAsNumber: true })} className="bg-white border-[#E5E5E5]" />
              {errors.harga_per_jam && <p className="text-xs text-[#B0523A]">{errors.harga_per_jam.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="kapasitas" className="text-xs font-bold text-[#0B0909] uppercase tracking-wider">Capacity (People)</Label>
              <Input id="kapasitas" type="number" step="any" {...register("kapasitas", { valueAsNumber: true })} className="bg-white border-[#E5E5E5]" />
              {errors.kapasitas && <p className="text-xs text-[#B0523A]">{errors.kapasitas.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deskripsi" className="text-xs font-bold text-[#0B0909] uppercase tracking-wider">Description</Label>
            <textarea
              id="deskripsi"
              {...register("deskripsi")}
              placeholder="Room description..."
              rows={3}
              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2.5 text-sm text-[#0B0909] outline-none focus:border-[#EF6905] transition-colors resize-none"
            />
            {errors.deskripsi && <p className="text-xs text-[#B0523A]">{errors.deskripsi.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="border-[#E5E5E5] text-[#0B0909]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#0B0909] text-white hover:bg-[#0B0909]/90 min-w-[120px]"
            >
              {isLoading ? "Saving..." : "Save Space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
