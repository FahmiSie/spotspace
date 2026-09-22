"use client";

import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import Link from "next/link";
import { Calendar, Clock, MapPin, Receipt, XCircle } from "lucide-react";
import { useMyReservasi, useCancelReservasi, StatusReservasi } from "@/lib/hooks/use-reservasi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

type TabFilter = "All" | "Pending Approval" | "Approved" | "Active" | "Completed" | "Cancelled";

const TABS: TabFilter[] = ["All", "Pending Approval", "Approved", "Active", "Completed", "Cancelled"];

export interface StatusBadgeInfo {
  label: string;
  style: string;
  tabCategory: TabFilter;
}

export function getStatusBadgeConfig(
  rawStatus?: string | null,
  paymentStatus?: string | null
): StatusBadgeInfo {
  const normalizedStatus = String(rawStatus || "").toLowerCase().trim();
  const normalizedPayment = String(paymentStatus || "").toLowerCase().trim();

  // 1. Pending Approval / Menunggu Persetujuan / Menunggu Verifikasi
  if (
    normalizedStatus === "menunggu_persetujuan" ||
    normalizedStatus === "pending_approval" ||
    normalizedStatus === "waiting_verification" ||
    normalizedStatus === "waiting_approval" ||
    normalizedStatus === "menunggu_verifikasi" ||
    (normalizedStatus === "belum_dikonfirm" && normalizedPayment === "paid")
  ) {
    return {
      label: "Pending Approval",
      style: "bg-amber-50 text-amber-800 border-amber-300/80 font-semibold",
      tabCategory: "Pending Approval",
    };
  }

  // 2. Belum Dikonfirmasi / Menunggu Pembayaran
  if (
    normalizedStatus === "belum_dikonfirm" ||
    normalizedStatus === "unpaid" ||
    normalizedStatus === "pending_payment" ||
    normalizedStatus === "awaiting_payment"
  ) {
    return {
      label: "Awaiting Payment",
      style: "bg-[#FFF4E5] text-[#B86B11] border-[#B86B11]/30 font-semibold",
      tabCategory: "Pending Approval",
    };
  }

  // Generic "pending"
  if (normalizedStatus === "pending") {
    const isPaid = normalizedPayment === "paid";
    return {
      label: isPaid ? "Pending Approval" : "Pending Payment",
      style: isPaid
        ? "bg-amber-50 text-amber-800 border-amber-300/80 font-semibold"
        : "bg-[#FFF4E5] text-[#B86B11] border-[#B86B11]/30 font-semibold",
      tabCategory: "Pending Approval",
    };
  }

  // 3. Disetujui / Approved
  if (normalizedStatus === "disetujui" || normalizedStatus === "approved") {
    return {
      label: "Approved",
      style: "bg-[#2F5D50]/10 text-[#2F5D50] border-[#2F5D50]/20 font-semibold",
      tabCategory: "Approved",
    };
  }

  // 4. Aktif / Active
  if (normalizedStatus === "aktif" || normalizedStatus === "active") {
    return {
      label: "Active",
      style: "bg-[#3B5BA5]/10 text-[#3B5BA5] border-[#3B5BA5]/20 font-semibold",
      tabCategory: "Active",
    };
  }

  // 5. Selesai / Completed
  if (normalizedStatus === "selesai" || normalizedStatus === "completed") {
    return {
      label: "Completed",
      style: "bg-[#6B665A]/10 text-[#6B665A] border-[#6B665A]/20 font-semibold",
      tabCategory: "Completed",
    };
  }

  // 6. Dibatalkan / Cancelled
  if (
    normalizedStatus === "dibatalkan" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled"
  ) {
    return {
      label: "Cancelled",
      style: "bg-[#B0523A]/10 text-[#B0523A] border-[#B0523A]/20 font-semibold",
      tabCategory: "Cancelled",
    };
  }

  // 7. Fallback untuk status kustom atau yang belum terdaftar:
  // Format teks status asli agar badge tidak pernah kosong
  const fallbackLabel = rawStatus
    ? String(rawStatus)
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : "Unknown";

  return {
    label: fallbackLabel,
    style: "bg-stone-100 text-stone-700 border-stone-300 font-semibold",
    tabCategory: "All",
  };
}

export default function ReservasiPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("All");
  const { data: reservasiList, isLoading, error } = useMyReservasi();
  const cancelMutation = useCancelReservasi();

  const handleCancel = async (id: number) => {
    try {
      await cancelMutation.mutateAsync(id);
      (toast as any).add({ title: "Reservation cancelled", type: "success" });
    } catch (err) { }
  };

  const filteredList = reservasiList?.filter((r) => {
    if (activeTab === "All") return true;
    const { tabCategory } = getStatusBadgeConfig(r.status, r.payment?.status);
    return tabCategory === activeTab;
  });

  return (
    <div className="w-full bg-paper min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-2">Reservation History</h1>
        <p className="text-ink mb-10">Manage all your workspace bookings and active passes.</p>

        {/* Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-8 border-b border-stone mb-10">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 whitespace-nowrap text-sm font-bold tracking-wider uppercase transition-colors relative ${activeTab === tab ? "text-flame" : "text-ink hover:text-ink"
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-flame" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-stone/20 rounded-2xl">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold text-ink">Failed to Load Data</h3>
            <p className="text-ink">An error occurred while fetching the reservation list.</p>
          </div>
        ) : filteredList && filteredList.length > 0 ? (
          <div className="space-y-6">
            {filteredList.map((r) => {
              const statusBadge = getStatusBadgeConfig(r.status, r.payment?.status);

              return (
                <div key={r.id} className="bg-white border border-stone rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-stone/80 transition-colors">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs border ${statusBadge.style}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-sm font-medium text-ink">
                        ID: {r.kode_booking}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-2xl font-bold text-ink">{r.space?.nama_space || "Unknown Space"}</h3>
                      <p className="text-ink text-sm mt-1">{r.space?.tipe || "General Space"}</p>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-ink" />
                        {new Date(r.tanggal_reservasi).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-ink" />
                        {r.jam_mulai} - {r.jam_selesai} ({r.durasi_jam} Hours)
                      </div>
                      <div className="flex items-center gap-2 font-medium text-ink">
                        <Receipt className="w-4 h-4 text-ink" />
                        Rp {(r.total_bayar || 0).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {r.status === 'dibatalkan' && (
                      <div className="mt-3 flex flex-col gap-2.5">
                        {r.alasanPenolakan && (
                          <div className="p-3 bg-red-50/80 border border-red-100 rounded-xl text-xs text-red-800">
                            <span className="font-semibold block mb-0.5">Cancellation Reason:</span>
                            <p className="text-stone-600">{r.alasanPenolakan}</p>
                          </div>
                        )}

                        {r.payment?.status === 'refunded' && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <div>
                                <div className="text-xs font-bold text-emerald-800">100% Refund Processed</div>
                                <div className="text-[11px] text-emerald-600">Refunded to original payment method within 1-2 business days</div>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-emerald-900">
                              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(r.total_bayar || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-col items-stretch md:items-end gap-3 shrink-0 border-t border-stone pt-4 md:border-t-0 md:pt-0 w-full md:w-auto">
                    {r.status === "belum_dikonfirm" && r.payment?.status !== 'paid' && (
                      <Link href={`/reservasi/${r.id}`} className="w-full md:w-auto">
                        <Button className="w-full md:w-auto bg-[#EF6905] hover:bg-[#EF6905]/90 text-white rounded-xl font-bold">
                          Pay Now
                        </Button>
                      </Link>
                    )}
                    {(r.status === "menunggu_persetujuan" || (r.status === "belum_dikonfirm" && r.payment?.status === 'paid')) && (
                      <span className="text-xs font-semibold text-amber-800 bg-amber-50/80 border border-amber-200 rounded-xl px-3 py-2 w-full md:w-auto text-center md:text-right">
                        Payment completed &bull; Awaiting admin approval
                      </span>
                    )}

                    {(r.status === "disetujui" || r.status === "aktif" || r.status === "selesai") && (
                      <Link href={`/reservasi/${r.id}/e-ticket`} className="w-full md:w-auto">
                        <Button variant="default" className="w-full md:w-auto bg-ink text-white hover:bg-ink/80 rounded-xl font-bold">
                          View E-Ticket
                        </Button>
                      </Link>
                    )}
                    {r.status === "selesai" && (
                      <Link href={`/spaces/${r.space?.id}`} className="w-full md:w-auto">
                        <Button variant="outline" className="w-full md:w-auto border-amber-500 text-amber-500 hover:bg-amber-50 rounded-xl font-bold">
                          ★ Leave Review
                        </Button>
                      </Link>
                    )}

                    {(r.status === "belum_dikonfirm" || r.status === "menunggu_persetujuan" || r.status === "disetujui") && (
                      <Dialog>
                        <DialogTrigger render={<Button variant="outline" className="w-full md:w-auto rounded-xl font-bold border-destructive text-destructive hover:bg-destructive/10">Cancel</Button>} />
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="font-display font-bold text-xl">Cancel Reservation?</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. The schedule you cancel will be available for other members.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-6">
                          <DialogClose render={<Button variant="outline" className="rounded-xl font-bold">Go Back</Button>} />
                          <DialogClose render={
                            <Button
                              variant="destructive"
                              className="rounded-xl font-bold bg-destructive text-white"
                              onClick={() => handleCancel(r.id)}
                              disabled={cancelMutation.isPending}
                            >
                              Yes, Cancel
                            </Button>
                          } />
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        ) : (
          <div className="text-center py-32 bg-stone/20 rounded-3xl border border-stone/50 border-dashed">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <MapPin className="w-8 h-8 text-ink" />
            </div>
            <h3 className="font-display text-2xl font-bold text-ink mb-2">No Reservations Yet</h3>
            <p className="text-ink mb-8 max-w-md mx-auto">You don't have any schedules in this category. Let's explore premium workspaces on SpotSpace!</p>
            <Link href="/spaces">
              <Button className="bg-flame hover:bg-flame/90 text-black font-bold px-8 py-6 rounded-xl text-lg">
                Find your space here!
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
