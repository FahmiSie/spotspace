"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { z } from "zod";
import { Plus, Search, Building2, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/admin/data-table";
import { CrudDialog, FieldConfig } from "@/components/admin/crud-dialog";
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
  useAdminMembers,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
} from "@/lib/hooks/use-admin";

const createSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  nama_member: z.string().min(2, "Name must be at least 2 characters"),
  instansi: z.string().min(1, "Company is required"),
  alamat: z.string().min(1, "Address is required"),
  telp: z.string().min(9, "Invalid phone number"),
});

const updateSchema = z.object({
  nama_member: z.string().min(2, "Name must be at least 2 characters"),
  instansi: z.string().optional(),
  alamat: z.string().optional(),
  telp: z.string().min(9, "Invalid phone number"),
  password: z.string().min(6).optional().or(z.literal("")),
});

const CREATE_FIELDS: FieldConfig[] = [
  { name: "username", label: "Username", type: "text", placeholder: "new_username" },
  { name: "password", label: "Password", type: "password", placeholder: "Min 6 characters" },
  { name: "nama_member", label: "Full Name", type: "text", placeholder: "Member name" },
  { name: "instansi", label: "Company", type: "text", placeholder: "Company / Institution name" },
  { name: "alamat", label: "Address", type: "text", placeholder: "Full address" },
  { name: "telp", label: "Phone", type: "text", placeholder: "081234567890" },
];

const UPDATE_FIELDS: FieldConfig[] = [
  { name: "nama_member", label: "Full Name", type: "text" },
  { name: "instansi", label: "Company", type: "text" },
  { name: "alamat", label: "Address", type: "text" },
  { name: "telp", label: "Phone", type: "text" },
  { name: "password", label: "New Password (leave empty if unchanged)", type: "password", placeholder: "Min 6 characters" },
];

const columns: Column<any>[] = [
  {
    key: "namaMember",
    label: "Name",
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#0B0909] text-white flex items-center justify-center font-semibold text-sm shrink-0">
          {(r.namaMember || "U").charAt(0).toUpperCase()}
        </div>
        <div className="font-medium text-[#0B0909]">{r.namaMember}</div>
      </div>
    )
  },
  { 
    key: "instansi", 
    label: "Company", 
    render: (r) => (
      <div className="flex items-center gap-1.5 text-[#0B0909]">
        <Building2 className="w-4 h-4" />
        <span>{r.instansi || "-"}</span>
      </div>
    ) 
  },
  { 
    key: "telp", 
    label: "Phone",
    render: (r) => (
      <div className="flex items-center gap-1.5 text-[#0B0909]">
        <Phone className="w-4 h-4" />
        <span>{r.telp || "-"}</span>
      </div>
    )
  },
  { 
    key: "alamat", 
    label: "Address", 
    render: (r) => (
      <div className="flex items-center gap-1.5 text-[#0B0909]" title={r.alamat}>
        <MapPin className="w-4 h-4 shrink-0" />
        <span className="truncate max-w-[200px]">{r.alamat || "-"}</span>
      </div>
    ) 
  },
];

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminMembers(search);
  const createMut = useCreateMember();
  const updateMut = useUpdateMember();
  const deleteMut = useDeleteMember();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [deleteRow, setDeleteRow] = useState<any>(null);

  const handleCreate = async (formData: any) => {
    try {
      await createMut.mutateAsync(formData);
      setCreateOpen(false);
      (toast as any).add({ title: "Member added successfully", type: "success" });
    } catch (err) {}
  };

  const handleUpdate = async (formData: any) => {
    if (!editRow) return;
    try {
      const payload = { ...formData, id: editRow.id };
      if (!payload.password) delete payload.password;
      await updateMut.mutateAsync(payload);
      setEditRow(null);
      (toast as any).add({ title: "Member updated successfully", type: "success" });
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      await deleteMut.mutateAsync(deleteRow.id);
      setDeleteRow(null);
      (toast as any).add({ title: "Member deleted successfully", type: "success" });
    } catch (err) {}
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0B0909]">Members</h1>
          <p className="text-[#0B0909] text-sm mt-1">Manage coworking space members.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0B0909]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#E5E5E5] bg-white text-sm text-[#0B0909] placeholder:text-[#0B0909] outline-none focus:border-[#EF6905] transition-colors shadow-sm"
            />
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-[#0B0909] hover:bg-[#0B0909]/90 text-white gap-2 shadow-sm rounded-lg shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onEdit={(row) => setEditRow(row)}
        onDelete={(row) => setDeleteRow(row)}
      />

      {/* Create Dialog */}
      <CrudDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add New Member"
        fields={CREATE_FIELDS}
        schema={createSchema}
        onSubmit={handleCreate}
        isLoading={createMut.isPending}
      />

      {/* Edit Dialog */}
      <CrudDialog
        open={!!editRow}
        onOpenChange={(v) => !v && setEditRow(null)}
        title="Edit Member"
        fields={UPDATE_FIELDS}
        schema={updateSchema}
        defaultValues={
          editRow
            ? {
                nama_member: editRow.namaMember,
                instansi: editRow.instansi ?? "",
                alamat: editRow.alamat ?? "",
                telp: editRow.telp ?? "",
                password: "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
        isLoading={updateMut.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRow} onOpenChange={(v) => !v && setDeleteRow(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-[#E5E5E5]">
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete member <strong>{deleteRow?.namaMember}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <DialogClose render={<Button variant="outline" className="border-[#E5E5E5] text-[#0B0909]" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="bg-[#B0523A] text-white hover:bg-[#B0523A]/90"
            >
              {deleteMut.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
