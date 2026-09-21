"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { Plus, Image as ImageIcon, X, Users, AlignLeft, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, Column } from "@/components/admin/data-table";
import { CrudDialog, FieldConfig } from "@/components/admin/crud-dialog";
import { CreateSpaceDialog } from "@/components/admin/create-space-dialog";
import { getAssetUrl } from "@/lib/utils";
import { uploadFiles } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  useAdminSpaces,
  useCreateSpace,
  useUpdateSpace,
  useDeleteSpace,
  useAddSpaceFoto,
  useDeleteSpaceFoto,
} from "@/lib/hooks/use-admin";

const TIPE_OPTIONS = [
  { value: "desk", label: "Personal Desk" },
  { value: "meeting_room", label: "Meeting Room" },
  { value: "private_office", label: "Private Office" },
];

const TIPE_LABELS: Record<string, string> = {
  desk: "Desk",
  meeting_room: "Meeting Room",
  private_office: "Private Office",
};

const spaceSchema = z.object({
  nama_space: z.string().min(2, "Name must be at least 2 characters"),
  harga_per_jam: z.number().min(1, "Price must be > 0"),
  tipe: z.enum(["desk", "meeting_room", "private_office"]),
  kapasitas: z.number().min(1, "Capacity min 1"),
  deskripsi: z.string().optional(),
  foto: z.any().optional(),
});

const FIELDS: FieldConfig[] = [
  { name: "nama_space", label: "Space Name", type: "text", placeholder: "Meeting Room A" },
  { name: "tipe", label: "Type", type: "select", options: TIPE_OPTIONS },
  { name: "harga_per_jam", label: "Price Per Hour (IDR)", type: "number", placeholder: "50000" },
  { name: "kapasitas", label: "Capacity (People)", type: "number", placeholder: "10" },
  { name: "deskripsi", label: "Description", type: "textarea", placeholder: "Room description..." },
  { name: "foto", label: "Upload New Main Photo", type: "file" },
];

const columns: Column<any>[] = [
  {
    key: "foto",
    label: "",
    render: (r) =>
      r.foto ? (
        <img
          src={getAssetUrl(r.foto)}
          alt={r.namaSpace}
          className="w-12 h-12 rounded-xl object-cover border border-[#E5E5E5]"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-[#0B0909]" />
        </div>
      ),
  },
  { 
    key: "namaSpace", 
    label: "Name",
    render: (r) => (
      <div>
        <div className="font-semibold text-[#0B0909]">{r.namaSpace}</div>
        <div className="text-xs text-[#0B0909] line-clamp-1">{r.deskripsi || "No description"}</div>
      </div>
    )
  },
  {
    key: "tipe",
    label: "Type",
    render: (r) => (
      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#FAFAFA] border border-[#E5E5E5] text-[#0B0909]">
        {TIPE_LABELS[r.tipe] || r.tipe}
      </span>
    ),
  },
  {
    key: "kapasitas",
    label: "Capacity",
    render: (r) => (
      <div className="flex items-center gap-1.5 text-[#0B0909] text-sm">
        <Users className="w-4 h-4" />
        <span>{r.kapasitas}</span>
      </div>
    )
  },
  {
    key: "hargaPerJam",
    label: "Price/Hour",
    render: (r) => (
      <span className="font-medium text-[#0B0909]">
        Rp {r.hargaPerJam?.toLocaleString("id-ID")}
      </span>
    ),
  }
];

export default function SpacesPage() {
  const { data, isLoading } = useAdminSpaces();
  const createMut = useCreateSpace();
  const updateMut = useUpdateSpace();
  const deleteMut = useDeleteSpace();
  const addFotoMut = useAddSpaceFoto();
  const delFotoMut = useDeleteSpaceFoto();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [deleteRow, setDeleteRow] = useState<any>(null);
  const [galleryRow, setGalleryRow] = useState<any>(null);
  const [newFotoFiles, setNewFotoFiles] = useState<File[]>([]);
  const [filterType, setFilterType] = useState<string>("all");

  const handleCreate = async (formData: any) => {
    try {
      await createMut.mutateAsync(formData);
      setCreateOpen(false);
      (toast as any).add({ title: "Space added successfully", type: "success" });
    } catch (err) {}
  };

  const handleUpdate = async (formData: any) => {
    if (!editRow) return;

    let fotoUrl = formData.foto;
    if (formData.foto instanceof FileList && formData.foto.length > 0) {
      try {
        const uploadRes = await uploadFiles([formData.foto[0]]);
        if (uploadRes.urls && uploadRes.urls.length > 0) {
          fotoUrl = uploadRes.urls[0];
        }
      } catch (e) {
        console.error("Failed to upload image", e);
      }
    } else if (formData.foto instanceof FileList && formData.foto.length === 0) {
      fotoUrl = undefined;
    }

    const payload = { ...formData, id: editRow.id };
    if (fotoUrl !== undefined) {
      payload.foto = fotoUrl;
    } else {
      delete payload.foto;
    }

    try {
      await updateMut.mutateAsync(payload);
      setEditRow(null);
      (toast as any).add({ title: "Space updated successfully", type: "success" });
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      await deleteMut.mutateAsync(deleteRow.id);
      setDeleteRow(null);
      (toast as any).add({ title: "Space deleted successfully", type: "success" });
    } catch (err) {}
  };

  const handleAddFoto = async () => {
    if (!galleryRow || newFotoFiles.length === 0) return;

    let loadingToastId: string | undefined;
    try {
      loadingToastId = (toast as any).add({ title: `Uploading ${newFotoFiles.length} photo(s)...`, type: "loading" });
      const uploadRes = await uploadFiles(newFotoFiles);
      const uploadedUrls = uploadRes.urls || [];
      if (uploadedUrls.length > 0) {
        (toast as any).update(loadingToastId, { title: "Photos uploaded, saving to gallery...", type: "loading" });
        for (const url of uploadedUrls) {
          await addFotoMut.mutateAsync({ spaceId: galleryRow.id, url });
        }
        (toast as any).update(loadingToastId, { title: "Success", description: "Photos added to gallery successfully.", type: "success" });
      }
    } catch (e: any) {
      console.error(e);
      if (loadingToastId) {
        (toast as any).update(loadingToastId, { title: "Upload Failed", description: e.message || "Failed to upload photo", type: "error" });
      } else {
        (toast as any).add({ title: "Upload Failed", description: e.message || "Failed to upload photo", type: "error" });
      }
    }

    setNewFotoFiles([]);
    const updated = data?.find((s: any) => s.id === galleryRow.id);
    if (updated) setGalleryRow({ ...updated });
  };

  const handleDeleteFoto = async (fotoId: number) => {
    if (!galleryRow) return;
    
    const isConfirmed = window.confirm("Are you sure to delete this selected image?");
    if (!isConfirmed) return;

    try {
      await delFotoMut.mutateAsync({ spaceId: galleryRow.id, fotoId });
      (toast as any).add({ title: "Success", description: "Photo deleted successfully", type: "success" });
      
      // Update gallery row to reflect deletion immediately
      setGalleryRow((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          fotoGaleri: prev.fotoGaleri?.filter((f: any) => f.id !== fotoId)
        };
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (filterType === "all") return data;
    return data.filter((s: any) => s.tipe === filterType);
  }, [data, filterType]);

  const totalWorkstations = data?.length || 0;
  const totalCapacity = data?.reduce((acc: number, space: any) => acc + (space.kapasitas || 0), 0) || 0;
  const activeSpaces = totalWorkstations; // Mock active for now as we don't have status

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0B0909]">Spaces & Desks</h1>
          <p className="text-[#0B0909] text-sm mt-1">Manage your workspace inventory and pricing.</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#0B0909] hover:bg-[#0B0909]/90 text-white gap-2 shadow-sm rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add Space
        </Button>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
            <Layers className="w-5 h-5 text-[#0B0909]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#0B0909] uppercase tracking-wider">Total Workstations</p>
            <p className="text-2xl font-bold text-[#0B0909]">{totalWorkstations}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
            <Users className="w-5 h-5 text-[#0B0909]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#0B0909] uppercase tracking-wider">Total Capacity</p>
            <p className="text-2xl font-bold text-[#0B0909]">{totalCapacity}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
            <AlignLeft className="w-5 h-5 text-[#0B0909]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#0B0909] uppercase tracking-wider">Active Spaces</p>
            <p className="text-2xl font-bold text-[#0B0909]">{activeSpaces}</p>
          </div>
        </div>
      </div>

      {/* Segmented Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E5E5E5]">
        {["all", "desk", "meeting_room", "private_office"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterType === t
                ? "bg-[#0B0909] text-white"
                : "bg-white text-[#0B0909] hover:bg-[#FAFAFA] border border-[#E5E5E5]"
            }`}
          >
            {t === "all" ? "All Spaces" : TIPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        onEdit={(row) => setEditRow(row)}
        onDelete={(row) => setDeleteRow(row)}
        actions={(row) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGalleryRow(row)}
              className="text-[#0B0909] hover:text-[#0B0909] hover:bg-[#FAFAFA]"
              title="Manage Gallery"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditRow(row)}
              className="text-[#0B0909] hover:text-[#0B0909] hover:bg-[#FAFAFA]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteRow(row)}
              className="text-[#B0523A]/70 hover:text-[#B0523A] hover:bg-[#B0523A]/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </Button>
          </div>
        )}
      />

      {/* Create Dialog */}
      <CreateSpaceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Edit Dialog */}
      <CrudDialog
        open={!!editRow}
        onOpenChange={(v) => !v && setEditRow(null)}
        title="Edit Space"
        fields={FIELDS}
        schema={spaceSchema}
        defaultValues={
          editRow
            ? {
                nama_space: editRow.namaSpace,
                tipe: editRow.tipe,
                harga_per_jam: editRow.hargaPerJam,
                kapasitas: editRow.kapasitas,
                deskripsi: editRow.deskripsi ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
        isLoading={updateMut.isPending}
      />

      {/* Delete Confirmation */}
      <Dialog open={!!deleteRow} onOpenChange={(v) => !v && setDeleteRow(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-[#E5E5E5]">
          <DialogHeader>
            <DialogTitle>Delete Space</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteRow?.namaSpace}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <DialogClose render={<Button variant="outline" className="border-[#E5E5E5] text-[#0B0909]" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleDelete} disabled={deleteMut.isPending} className="bg-[#B0523A] text-white hover:bg-[#B0523A]/90">
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Dialog */}
      <Dialog open={!!galleryRow} onOpenChange={(v) => !v && setGalleryRow(null)}>
        <DialogContent className="sm:max-w-xl rounded-2xl border-[#E5E5E5]">
          <DialogHeader>
            <DialogTitle>Photo Gallery: {galleryRow?.namaSpace}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing photos */}
            <div className="grid grid-cols-3 gap-3">
              {/* Main Photo */}
              {galleryRow?.foto && (
                <div className="relative group rounded-xl overflow-hidden aspect-square border-2 border-[#EF6905]">
                  <img src={getAssetUrl(galleryRow.foto)} alt="Main" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-1">
                    Main Photo
                  </div>
                </div>
              )}
              {/* Gallery Photos */}
              {galleryRow?.fotoGaleri?.map((foto: any) => (
                <div key={foto.id} className="relative group rounded-xl overflow-hidden aspect-square border border-[#E5E5E5]">
                  <img src={getAssetUrl(foto.url)} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeleteFoto(foto.id)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {!galleryRow?.foto && (!galleryRow?.fotoGaleri || galleryRow.fotoGaleri.length === 0) && (
                <p className="col-span-3 text-center text-[#0B0909] py-8 text-sm">No photos uploaded yet.</p>
              )}
            </div>

            {/* Add new photo */}
            <div className="flex gap-2 pt-4 border-t border-[#E5E5E5]">
              <Input
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setNewFotoFiles(Array.from(e.target.files));
                  } else {
                    setNewFotoFiles([]);
                  }
                }}
                className="flex-1 rounded-lg border-[#E5E5E5]"
              />
              <Button
                onClick={handleAddFoto}
                disabled={newFotoFiles.length === 0 || addFotoMut.isPending}
                className="bg-[#0B0909] text-white hover:bg-[#0B0909]/90 rounded-lg"
              >
                {addFotoMut.isPending ? "Uploading..." : "Add Photos"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
