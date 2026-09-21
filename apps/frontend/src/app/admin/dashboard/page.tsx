"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  CalendarClock,
  TrendingUp,
  Plus,
  RefreshCw,
  Calendar,
  ArrowRight,
  Briefcase,
  LayoutGrid,
  DoorOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateSpaceDialog } from "@/components/admin/create-space-dialog";
import {
  useAdminMembers,
  useAdminSpaces,
  useAdminReservasi,
  useAdminReports,
} from "@/lib/hooks/use-admin";
import { useQueryClient } from "@tanstack/react-query";

const TIPE_LABELS: Record<string, string> = {
  desk: "Desk",
  meeting_room: "Meeting Room",
  private_office: "Private Office",
};

const TIPE_ICONS: Record<string, typeof Briefcase> = {
  desk: Briefcase,
  meeting_room: LayoutGrid,
  private_office: DoorOpen,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  belum_dikonfirm: { label: "Pending", color: "#E0A438", bg: "rgba(224,164,56,0.1)" },
  disetujui: { label: "Approved", color: "#2F5D50", bg: "rgba(47,93,80,0.1)" },
  aktif: { label: "Active", color: "#3B5BA5", bg: "rgba(59,91,165,0.1)" },
  selesai: { label: "Completed", color: "#6B665A", bg: "rgba(107,102,90,0.1)" },
  dibatalkan: { label: "Cancelled", color: "#B0523A", bg: "rgba(176,82,58,0.1)" },
};

const formatIDR = (num: number) =>
  `Rp ${num.toLocaleString("id-ID")}`;

export default function DashboardPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const { data: members, isLoading: lMembers } = useAdminMembers();
  const { data: spaces, isLoading: lSpaces } = useAdminSpaces();
  const { data: pendingReservasi, isLoading: lPending } = useAdminReservasi({ status: "belum_dikonfirm" });
  const { data: allReservasi, isLoading: lReservasi } = useAdminReservasi();
  const { data: reports, isLoading: lReports } = useAdminReports();

  const isLoading = lMembers || lSpaces || lPending || lReservasi || lReports;

  const totalMembers = members?.length ?? 0;
  const totalSpaces = spaces?.length ?? 0;
  const pendingCount = pendingReservasi?.length ?? 0;
  const totalRevenue = reports?.realisasi_pendapatan_bersih ?? 0;

  // Recent 5 bookings sorted by createdAt desc
  const recentBookings = allReservasi
    ? [...allReservasi]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    : [];

  // Space breakdown by type
  const spaceBreakdown: Record<string, { count: number; totalCapacity: number }> = {};
  if (spaces) {
    for (const s of spaces as any[]) {
      const tipe = s.tipe || "unknown";
      if (!spaceBreakdown[tipe]) spaceBreakdown[tipe] = { count: 0, totalCapacity: 0 };
      spaceBreakdown[tipe].count += 1;
      spaceBreakdown[tipe].totalCapacity += s.kapasitas || 0;
    }
  }

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
            Dashboard Overview
          </h1>
          <p className="text-ink text-sm mt-1">
            Live workspace metrics, member occupancy, and monthly revenue overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-stone text-ink hover:text-ink hover:border-ink/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="bg-[#EF6905] hover:bg-[#EF6905]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Space
          </Button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Revenue Card (Featured) */}
        {isLoading ? (
          <Skeleton className="h-36 rounded-xl" />
        ) : (
          <div className="rounded-xl border border-stone/50 bg-white p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#EF6905]" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#EF6905]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#EF6905]" />
              </div>
              <span className="text-[10px] font-semibold text-ink uppercase tracking-wider">
                Total Revenue (This Month)
              </span>
            </div>
            <p className="font-display text-3xl font-bold text-ink mb-1">
              {formatIDR(totalRevenue)}
            </p>
            <p className="text-xs text-ink">Verified bookings revenue</p>
          </div>
        )}

        {/* Members Card */}
        {isLoading ? (
          <Skeleton className="h-36 rounded-xl" />
        ) : (
          <div className="rounded-xl border border-stone/50 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center">
                <Users className="w-4 h-4 text-ink" />
              </div>
              <span className="text-[10px] font-semibold text-ink uppercase tracking-wider">
                Registered Members
              </span>
            </div>
            <p className="font-display text-3xl font-bold text-ink mb-1">
              {totalMembers}
            </p>
            <p className="text-xs text-ink">Active user community</p>
          </div>
        )}

        {/* Spaces Card */}
        {isLoading ? (
          <Skeleton className="h-36 rounded-xl" />
        ) : (
          <div className="rounded-xl border border-stone/50 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-ink" />
              </div>
              <span className="text-[10px] font-semibold text-ink uppercase tracking-wider">
                Total Workstations & Suites
              </span>
            </div>
            <p className="font-display text-3xl font-bold text-ink mb-1">
              {totalSpaces}
            </p>
            <p className="text-xs text-ink">Available units across location</p>
          </div>
        )}

        {/* Pending Card */}
        {isLoading ? (
          <Skeleton className="h-36 rounded-xl" />
        ) : (
          <div className="rounded-xl border border-stone/50 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-ink/5 flex items-center justify-center">
                <CalendarClock className="w-4 h-4 text-ink" />
              </div>
              <span className="text-[10px] font-semibold text-ink uppercase tracking-wider">
                Pending Reservations
              </span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-display text-3xl font-bold text-ink">
                {pendingCount}
              </p>
              {pendingCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF6905] animate-pulse" />
              )}
            </div>
            <p className="text-xs text-ink">
              Requires admin review{" "}
              {pendingCount > 0 && (
                <Link
                  href="/admin/reservasi"
                  className="text-[#EF6905] hover:underline font-medium"
                >
                  — Review now
                </Link>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Split Section: Recent Bookings + Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Bookings (2/3) */}
        <div className="lg:col-span-2 rounded-xl border border-stone/50 bg-white overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone/30">
            <h2 className="font-display text-lg font-bold text-ink">
              Recent Bookings & Activity
            </h2>
            <Link
              href="/admin/reservasi"
              className="text-sm text-[#EF6905] hover:underline font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-stone/10 flex items-center justify-center mb-4">
                <Calendar className="w-7 h-7 text-ink" />
              </div>
              <h3 className="font-display text-lg font-bold text-ink mb-1">
                No Recent Bookings
              </h3>
              <p className="text-sm text-ink max-w-sm">
                When members start reserving spaces, their latest activity will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-ink font-semibold border-b border-stone/20">
                    <th className="text-left px-6 py-3">Member</th>
                    <th className="text-left px-4 py-3">Space</th>
                    <th className="text-left px-4 py-3">Schedule</th>
                    <th className="text-right px-4 py-3">Total Amount</th>
                    <th className="text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((r: any) => {
                    const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.belum_dikonfirm;
                    const memberName = r.member?.nama_member || r.member?.namaMember || r.member?.name || "Unknown";
                    const memberInitial = memberName.charAt(0).toUpperCase();
                    const instansi = r.member?.instansi;
                    const spaceName = r.space?.nama_space || r.space?.namaSpace || r.space?.name || "—";
                    const spaceType = r.space?.tipe;
                    
                    const dateVal = r.tanggal_reservasi || r.tanggalReservasi || r.tanggal;
                    const tanggal = dateVal ? new Date(dateVal).toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric"
                    }) : "Invalid Date";
                    
                    const jamMulai = r.jam_mulai || r.jamMulai || "—";
                    const jamSelesai = r.jam_selesai || r.jamSelesai || "—";
                    
                    const totalBayar = r.total_bayar ?? r.totalBayar ?? r.totalAmount ?? 0;

                    return (
                      <tr
                        key={r.id}
                        className="border-b border-stone/10 last:border-b-0 hover:bg-stone/5 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-ink/10 flex items-center justify-center text-xs font-bold text-ink shrink-0">
                              {memberInitial}
                            </div>
                            <div className="min-w-0">
                              <p className="text-ink font-medium truncate">{memberName}</p>
                              {instansi && (
                                <p className="text-[11px] text-ink truncate">{instansi}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-ink font-medium">{spaceName}</p>
                          {spaceType && (
                            <span className="text-[10px] bg-ink/5 text-ink px-1.5 py-0.5 rounded font-medium">
                              {TIPE_LABELS[spaceType] || spaceType}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-ink font-medium">{tanggal}</p>
                          <p className="text-[11px] text-ink mt-0.5">
                            {jamMulai} — {jamSelesai}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right font-display font-semibold text-ink whitespace-nowrap">
                          {formatIDR(totalBayar)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
                            style={{
                              color: sc.color,
                              backgroundColor: sc.bg,
                            }}
                          >
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Capacity & Breakdown (1/3) */}
        <div className="space-y-4">
          <div className="rounded-xl border border-stone/50 bg-white p-5">
            <h3 className="font-display text-sm font-bold text-ink uppercase tracking-wider mb-5">
              Space Breakdown
            </h3>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : Object.keys(spaceBreakdown).length === 0 ? (
              <p className="text-sm text-ink text-center py-6">No spaces created yet.</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(spaceBreakdown).map(([tipe, data]) => {
                  const Icon = TIPE_ICONS[tipe] || Building2;
                  const proportion = totalSpaces > 0 ? (data.count / totalSpaces) * 100 : 0;
                  return (
                    <div key={tipe} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-ink" />
                          <span className="text-sm font-medium text-ink">
                            {TIPE_LABELS[tipe] || tipe}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-display text-lg font-bold text-ink">
                            {data.count}
                          </span>
                          <span className="text-xs text-ink ml-1">unit{data.count !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-stone/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-ink/70 rounded-full transition-all duration-500"
                          style={{ width: `${proportion}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-ink">
                        Total capacity: {data.totalCapacity} seat{data.totalCapacity !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Add CTA */}
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full rounded-xl bg-ink text-white p-4 flex items-center justify-between hover:bg-ink/90 transition-colors group"
          >
            <div>
              <p className="text-sm font-semibold text-left">Quick Add Space</p>
              <p className="text-xs text-white/50 text-left">Add a new workstation or suite</p>
            </div>
            <Plus className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Create Space Dialog */}
      <CreateSpaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
