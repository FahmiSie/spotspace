"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { z } from "zod";
import { Plus, Tag, Calendar, Percent } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
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
  useAdminDiskon,
  useCreateDiskon,
  useUpdateDiskon,
  useDeleteDiskon,
} from "@/lib/hooks/use-admin";

const diskonSchema = z.object({
  nama_diskon: z.string().min(2, "Discount name must be at least 2 characters"),
  persentase_diskon: z.number().min(1, "Min 1%").max(100, "Max 100%"),
  tanggal_awal: z.string().min(1, "Required"),
  tanggal_akhir: z.string().min(1, "Required"),
}).refine((data) => {
  const start = new Date(data.tanggal_awal);
  const end = new Date(data.tanggal_akhir);
  return start <= end;
}, {
  message: "Start date must be before or equal to end date",
  path: ["tanggal_awal"],
});

const FIELDS: FieldConfig[] = [
  { name: "nama_diskon", label: "Discount Name / Code", type: "text", placeholder: "PROMO50" },
  { name: "persentase_diskon", label: "Percentage (%)", type: "number", placeholder: "20" },
  { name: "tanggal_awal", label: "Valid From", type: "date" },
  { name: "tanggal_akhir", label: "Valid Until", type: "date" },
];

function formatDate(d: string) {
  try {
    return format(new Date(d), "dd MMM yyyy", { locale: localeId });
  } catch {
    return d;
  }
}

function isActive(start: string, end: string) {
  const now = new Date();
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  return startDate <= now && now <= endDate;
}

const columns: Column<any>[] = [
  { 
    key: "namaDiskon", 
    label: "Discount Code",
    render: (r) => (
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#FAFAFA] rounded-md border border-[#E5E5E5] text-[#0B0909]">
          <Tag className="w-4 h-4" />
        </div>
        <span className="font-semibold text-[#0B0909] font-mono tracking-wide">{r.namaDiskon}</span>
      </div>
    )
  },
  {
    key: "persentaseDiskon",
    label: "Discount",
    render: (r) => (
      <div className="flex items-center gap-1.5 text-[#0B0909] font-medium">
        <Percent className="w-3.5 h-3.5" />
        {r.persentaseDiskon}
      </div>
    ),
  },
  {
    key: "tanggalAwal",
    label: "Valid Period",
    render: (r) => (
      <div className="flex items-center gap-2 text-sm text-[#0B0909]">
        <Calendar className="w-4 h-4 shrink-0" />
        <span className="whitespace-nowrap">{formatDate(r.tanggalAwal)} — {formatDate(r.tanggalAkhir)}</span>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (r) => {
      const active = isActive(r.tanggalAwal, r.tanggalAkhir);
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
            active
              ? "bg-[#E6F4EA] text-[#137333] border-[#137333]/20"
              : "bg-[#FAFAFA] text-[#0B0909] border-[#E5E5E5]"
          }`}
        >
          {active ? "Active" : "Expired"}
        </span>
      );
    },
  },
];

export default function DiskonPage() {
  const { data, isLoading } = useAdminDiskon();
  const createMut = useCreateDiskon();
  const updateMut = useUpdateDiskon();
  const deleteMut = useDeleteDiskon();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<any>(null);
  const [deleteRow, setDeleteRow] = useState<any>(null);

  const handleCreate = async (formData: any) => {
    try {
      await createMut.mutateAsync(formData);
      setCreateOpen(false);
      (toast as any).add({ title: "Discount created successfully", type: "success" });
    } catch (err) {}
  };

  const handleUpdate = async (formData: any) => {
    if (!editRow) return;
    try {
      await updateMut.mutateAsync({ ...formData, id: editRow.id });
      setEditRow(null);
      (toast as any).add({ title: "Discount updated successfully", type: "success" });
    } catch (err) {}
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      await deleteMut.mutateAsync(deleteRow.id);
      setDeleteRow(null);
      (toast as any).add({ title: "Discount deleted successfully", type: "success" });
    } catch (err) {}
  };

  const activePromos = data?.filter((d: any) => isActive(d.tanggalAwal, d.tanggalAkhir)).length || 0;
  const expiredPromos = (data?.length || 0) - activePromos;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0B0909]">Discounts</h1>
          <p className="text-[#0B0909] text-sm mt-1">Manage promo codes and percentage discounts.</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-[#0B0909] hover:bg-[#0B0909]/90 text-white gap-2 shadow-sm rounded-lg"
        >
          <Plus className="w-4 h-4" /> Add Discount
        </Button>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#E6F4EA] rounded-lg border border-[#137333]/20">
            <Tag className="w-5 h-5 text-[#137333]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#0B0909] uppercase tracking-wider">Active Promos</p>
            <p className="text-2xl font-bold text-[#0B0909]">{activePromos}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-sm flex items-center gap-4">
          <div className="p-3 bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
            <Calendar className="w-5 h-5 text-[#0B0909]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#0B0909] uppercase tracking-wider">Expired Promos</p>
            <p className="text-2xl font-bold text-[#0B0909]">{expiredPromos}</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onEdit={(row) => setEditRow(row)}
        onDelete={(row) => setDeleteRow(row)}
      />

      <CrudDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add New Discount"
        fields={FIELDS}
        schema={diskonSchema}
        onSubmit={handleCreate}
        isLoading={createMut.isPending}
      />

      <CrudDialog
        open={!!editRow}
        onOpenChange={(v) => !v && setEditRow(null)}
        title="Edit Discount"
        fields={FIELDS}
        schema={diskonSchema}
        defaultValues={
          editRow
            ? {
                nama_diskon: editRow.namaDiskon,
                persentase_diskon: editRow.persentaseDiskon,
                tanggal_awal: editRow.tanggalAwal?.split("T")[0] ?? "",
                tanggal_akhir: editRow.tanggalAkhir?.split("T")[0] ?? "",
              }
            : undefined
        }
        onSubmit={handleUpdate}
        isLoading={updateMut.isPending}
      />

      <Dialog open={!!deleteRow} onOpenChange={(v) => !v && setDeleteRow(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border-[#E5E5E5]">
          <DialogHeader>
            <DialogTitle>Delete Discount</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete discount <strong>{deleteRow?.namaDiskon}</strong>?
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
    </div>
  );
}
