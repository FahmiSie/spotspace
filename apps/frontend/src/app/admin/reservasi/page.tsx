"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar, Hash, User, Building, CreditCard, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/admin/data-table";
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
  useAdminReservasi,
  useUpdateReservasiStatus,
  useCheckIn,
  useCheckOut,
} from "@/lib/hooks/use-admin";

type StatusReservasi = "belum_dikonfirm" | "menunggu_persetujuan" | "disetujui" | "aktif" | "selesai" | "dibatalkan";

const STATUS_STYLES: Record<StatusReservasi, string> = {
  belum_dikonfirm: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
  menunggu_persetujuan: "bg-[#FFF4E5] text-[#B86B11] border-[#B86B11]/20",
  disetujui: "bg-[#E6F4EA] text-[#137333] border-[#137333]/20",
  aktif: "bg-[#E8F0FE] text-[#1967D2] border-[#1967D2]/20",
  selesai: "bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]",
  dibatalkan: "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/20",
};

const STATUS_LABELS: Record<StatusReservasi, string> = {
  belum_dikonfirm: "Unpaid",
  menunggu_persetujuan: "Pending Approval",
  disetujui: "Approved",
  aktif: "Active",
  selesai: "Completed",
  dibatalkan: "Cancelled",
};

type TabFilter = "All" | "Pending Approval" | "Approved" | "Active" | "Completed" | "Cancelled";
const TABS: TabFilter[] = ["All", "Pending Approval", "Approved", "Active", "Completed", "Cancelled"];

const columns: Column<any>[] = [
  { 
    key: "kodeBooking", 
    label: "Booking Code", 
    render: (r: any) => (
      <div className="flex items-center gap-1.5 text-[#0B0909]">
        <Hash className="w-3.5 h-3.5 text-[#0B0909]" />
        <span className="font-mono text-xs font-semibold">{r.kode_booking || r.kodeBooking}</span>
      </div>
    )
  },
  { 
    key: "member", 
    label: "Member", 
    render: (r: any) => (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center shrink-0">
          <User className="w-3 h-3 text-[#0B0909]" />
        </div>
        <span className="font-medium text-[#0B0909]">{r.member?.nama_member || r.member?.namaMember || "-"}</span>
      </div>
    )
  },
  { 
    key: "space", 
    label: "Space", 
    render: (r: any) => (
      <div className="flex items-center gap-2 text-[#0B0909]">
        <Building className="w-3.5 h-3.5" />
        <span>{r.space?.nama_space || r.space?.namaSpace || "-"}</span>
      </div>
    )
  },
  {
    key: "tanggal",
    label: "Schedule",
    render: (r: any) => {
      try {
        const d = r.tanggal_reservasi || r.tanggalReservasi;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-[#0B0909]">
              {new Date(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-xs text-[#0B0909]">{r.jam_mulai || r.jamMulai} — {r.jam_selesai || r.jamSelesai}</span>
          </div>
        );
      } catch { return "-"; }
    },
  },
  {
    key: "status",
    label: "Status",
    render: (r: any) => {
      const st = r.status as StatusReservasi;
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${STATUS_STYLES[st]}`}>
          {STATUS_LABELS[st]}
        </span>
      );
    },
  },
  {
    key: "totalBayar",
    label: "Total Amount",
    render: (r: any) => (
      <div className="flex items-center gap-1.5 font-medium text-[#0B0909]">
        <CreditCard className="w-3.5 h-3.5 text-[#0B0909]" />
        <span>Rp {(r.total_bayar ?? r.totalBayar ?? 0).toLocaleString("id-ID")}</span>
      </div>
    )
  },
];

export default function AdminReservasiPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("All");
  const [alasanPenolakan, setAlasanPenolakan] = useState("");
  
  const queryParams = activeTab === "All" ? {} : { status: TABS.find(t => t === activeTab) ? Object.keys(STATUS_LABELS).find(k => STATUS_LABELS[k as StatusReservasi] === activeTab) : undefined };
  
  const { data, isLoading } = useAdminReservasi(queryParams as any);
  const updateStatusMut = useUpdateReservasiStatus();
  const checkInMut = useCheckIn();
  const checkOutMut = useCheckOut();

  const [confirmAction, setConfirmAction] = useState<{
    id: number;
    action: "konfirmasi" | "tolak" | "check-in" | "check-out";
    label: string;
    isPaid?: boolean;
  } | null>(null);

  const pendingCount = data?.filter((r: any) => r.status === "menunggu_persetujuan").length || 0;

  const filteredData = data?.filter((r: any) => {
    if (activeTab === "All") return true;
    return STATUS_LABELS[r.status as StatusReservasi] === activeTab;
  });

  const handleAction = async () => {
    if (!confirmAction) return;
    const { id, action } = confirmAction;
    
    // Close dialog immediately before processing to improve perceived responsiveness
    setConfirmAction(null);
    const currentAlasan = alasanPenolakan;
    setAlasanPenolakan("");
    
    const loadingToast = (toast as any).add({ title: "Processing request...", type: "loading" });

    try {
      if (action === "konfirmasi") {
        await updateStatusMut.mutateAsync({ id, status: "disetujui" });
        (toast as any).update(loadingToast, { title: "Reservation approved successfully", type: "success" });
      } else if (action === "tolak") {
        await updateStatusMut.mutateAsync({ id, status: "dibatalkan", alasan: currentAlasan });
        (toast as any).update(loadingToast, { title: "Reservation rejected successfully", type: "success" });
      } else if (action === "check-in") {
        await checkInMut.mutateAsync(id);
        (toast as any).update(loadingToast, { title: "Check-in successful", type: "success" });
      } else if (action === "check-out") {
        await checkOutMut.mutateAsync(id);
        (toast as any).update(loadingToast, { title: "Check-out successful", type: "success" });
      }
    } catch (err: any) {
      (toast as any).update(loadingToast, { title: "Action failed", description: err.message, type: "error" });
    }
  };

  const isPending = updateStatusMut.isPending || checkInMut.isPending || checkOutMut.isPending;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0B0909]">Reservations</h1>
          <p className="text-[#0B0909] max-w-lg">Manage all incoming bookings, approve requests, and monitor active sessions across your spaces.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 p-1 bg-white border border-[#E5E5E5] rounded-xl w-max overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-[#0B0909] text-white"
                    : "text-[#0B0909] hover:text-[#0B0909] hover:bg-[#FAFAFA]"
                }`}
              >
                {tab}
                {tab === "Pending Approval" && pendingCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab ? "bg-[#EF6905] text-white" : "bg-[#FFF4E5] text-[#EF6905]"
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden shadow-sm">
        {filteredData?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4">
            <div className="w-16 h-16 bg-[#FAFAFA] rounded-full flex items-center justify-center border border-[#E5E5E5] mb-4">
              <Calendar className="w-8 h-8 text-[#0B0909]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0B0909]">No reservations found</h3>
            <p className="text-[#0B0909] text-sm mt-1 max-w-sm">
              There are currently no {activeTab !== "All" ? activeTab.toLowerCase() : ""} reservations in the system.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            emptyMessage="No reservations found."
            actions={(row) => {
              const st = row.status as StatusReservasi;
              return (
                <div className="flex items-center gap-1 justify-end">
                  {st === "menunggu_persetujuan" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          setConfirmAction({ id: row.id, action: "konfirmasi", label: "Approve this reservation?" })
                        }
                        className="bg-[#137333] text-white hover:bg-[#137333]/90 text-xs"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setConfirmAction({ id: row.id, action: "tolak", label: "Reject or cancel this reservation?", isPaid: row.payment?.status === 'paid' })
                        }
                        className="text-[#C5221F] hover:bg-[#FCE8E6] hover:text-[#C5221F] text-xs"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {st === "disetujui" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                           setConfirmAction({ id: row.id, action: "check-in", label: "Check-in member now?" })
                        }
                        className="bg-[#1967D2] text-white hover:bg-[#1967D2]/90 text-xs"
                      >
                        Check-in
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setConfirmAction({ id: row.id, action: "tolak", label: "Reject or cancel this reservation?", isPaid: row.payment?.status === 'paid' })
                        }
                        className="text-[#C5221F] hover:bg-[#FCE8E6] hover:text-[#C5221F] text-xs"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  {st === "aktif" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        setConfirmAction({ id: row.id, action: "check-out", label: "Check out member now?" })
                      }
                      className="bg-[#374151] text-white hover:bg-[#374151]/90 text-xs"
                    >
                      Check-out
                    </Button>
                  )}
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Confirm action dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(v) => {
        if (!v) {
          setConfirmAction(null);
          setAlasanPenolakan("");
        }
      }}>
        <DialogContent className="sm:max-w-md rounded-2xl border-[#E5E5E5]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#0B0909]">{confirmAction?.action === 'tolak' ? 'Reject Reservation' : 'Confirm Action'}</DialogTitle>
            <DialogDescription className="text-[#0B0909]">{confirmAction?.label}</DialogDescription>
          </DialogHeader>
          
          {confirmAction?.action === 'tolak' && (
            <div className="mt-2 space-y-4">
              {confirmAction.isPaid && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs text-red-800 font-medium leading-relaxed">
                    This booking has been paid. Rejecting it will mark the payment for a 100% refund to the member.
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="alasan" className="block text-sm font-medium text-[#0B0909] mb-1.5">Rejection Reason (Optional)</label>
                <textarea
                  id="alasan"
                  value={alasanPenolakan}
                  onChange={(e) => setAlasanPenolakan(e.target.value)}
                  placeholder="e.g., Space under emergency maintenance or fully booked."
                  className="w-full h-24 p-3 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <DialogClose render={<Button variant="outline" className="border-[#E5E5E5] text-[#0B0909]" />}>
              Cancel
            </DialogClose>
            <Button 
              onClick={handleAction} 
              disabled={isPending} 
              className={`text-white min-w-[120px] ${
                confirmAction?.action === 'tolak' 
                  ? 'bg-[#C5221F] hover:bg-[#C5221F]/90' 
                  : 'bg-[#0B0909] hover:bg-[#0B0909]/90'
              }`}
            >
              {isPending ? "Processing..." : (confirmAction?.action === 'tolak' && confirmAction?.isPaid ? "Reject & Refund" : "Yes, Continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
