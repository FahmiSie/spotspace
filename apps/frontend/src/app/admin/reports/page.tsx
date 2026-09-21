"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText, FileSpreadsheet, TrendingUp, TrendingDown, Hash, Percent, Wallet, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useAdminReports } from "@/lib/hooks/use-admin";
import { useAuthStore } from "@/lib/auth-store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const COLORS = ["#EF6905", "#0B0909", "#E5E5E5"];

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading } = useAdminReports({ bulan: month, tahun: year });
  const token = useAuthStore((s) => s.token);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const handleExport = (format: "pdf" | "xlsx") => {
    const url = `${baseUrl}/admin/reports/monthly/export?format=${format}&month=${month}&year=${year}`;
    // Open in new tab with auth header via fetch + blob
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `laporan-${MONTHS[month - 1]}-${year}.${format}`;
        a.click();
        URL.revokeObjectURL(a.href);
      });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header & Telemetry */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#0B0909]">Revenue & Occupancy Analytics</h1>
          <p className="text-[#0B0909] text-sm mt-1">Monitor financial performance and space utilization.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center bg-white p-1 rounded-lg border border-stone-200 shadow-sm w-full sm:w-auto h-10">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent pl-3 pr-2 py-1.5 text-sm font-medium text-[#0B0909] outline-none cursor-pointer"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <div className="h-5 w-[1px] bg-stone-200 my-auto mx-1" />
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent pl-2 pr-4 py-1.5 text-sm font-medium text-[#0B0909] outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => handleExport("pdf")} variant="outline" className="gap-2 border-[#E5E5E5] text-[#0B0909] flex-1 sm:flex-none">
              <FileText className="w-4 h-4" /> PDF
            </Button>
            <Button onClick={() => handleExport("xlsx")} variant="outline" className="gap-2 border-[#E5E5E5] text-[#0B0909] flex-1 sm:flex-none">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Skeleton className="h-[380px] rounded-2xl" />
            <Skeleton className="h-[380px] rounded-2xl" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* 4 KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
                <Wallet className="w-10 h-10 text-stone-900" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">Total Revenue (Gross)</p>
              <p className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight">
                Rp {data.estimasi_pendapatan_kotor?.toLocaleString("id-ID")}
              </p>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
                <Hash className="w-10 h-10 text-stone-900" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">Total Bookings</p>
              <div className="flex items-baseline gap-1.5">
                <p className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight">
                  {data.total_transaksi}
                </p>
                <span className="text-xs text-stone-500 font-normal">reservations</span>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
              <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
                <Percent className="w-10 h-10 text-stone-900" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">Promo Impact</p>
              <p className="font-display text-2xl md:text-3xl font-bold text-[#EF6905] tracking-tight">
                - Rp {data.total_potongan_diskon?.toLocaleString("id-ID")}
              </p>
            </div>
            
            <div className="bg-ink p-5 rounded-2xl border border-ink shadow-md relative overflow-hidden text-white flex flex-col justify-between min-h-[120px]">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-[#EF6905] to-[#EF6905]/30"></div>
              <div className="absolute right-3 top-3 opacity-10 pointer-events-none">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <p className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">Net Settled Revenue</p>
              <p className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
                Rp {data.realisasi_pendapatan_bersih?.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Dual Visual Charts */}
          {data.rincian_per_tipe_space?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chart 1: Bar Chart Revenue per Space Type */}
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm flex flex-col h-[380px]">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-[#0B0909]" />
                  <h3 className="font-semibold text-[#0B0909]">Revenue by Space Type</h3>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.rincian_per_tipe_space} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#0B0909", opacity: 0.7 }} dy={10} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#0B0909", opacity: 0.7 }}
                        tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
                      />
                      <Tooltip
                        cursor={{ fill: '#FAFAFA' }}
                        formatter={(value: any) => [`Rp ${Number(value).toLocaleString("id-ID")}`, "Revenue"]}
                        contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E5", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: 13, fontWeight: 500 }}
                      />
                      <Bar dataKey="total_pendapatan" radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {data.rincian_per_tipe_space.map((_: any, i: number) => (
                          <Cell key={i} fill={i === 0 ? "#EF6905" : "#0B0909"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Donut Chart Booking Share */}
              <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-sm flex flex-col h-[380px]">
                <div className="flex items-center gap-2 mb-2">
                  <PieChartIcon className="w-5 h-5 text-[#0B0909]" />
                  <h3 className="font-semibold text-[#0B0909]">Bookings Distribution</h3>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.rincian_per_tipe_space}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="total_booking"
                        nameKey="label"
                        stroke="none"
                      >
                        {data.rincian_per_tipe_space.map((_: any, i: number) => (
                          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value} bookings`, "Count"]}
                        contentStyle={{ borderRadius: 12, border: "1px solid #E5E5E5", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: 13, fontWeight: 500 }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle" 
                        iconSize={8}
                        wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#0B0909' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Summary Ledger Table */}
          <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <h3 className="font-semibold text-[#0B0909]">Space Performance Ledger</h3>
            </div>
            {data.rincian_per_tipe_space?.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-white">
                    <th className="text-left px-6 py-3.5 font-semibold text-[#0B0909] text-xs uppercase tracking-wider">Space Type</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#0B0909] text-xs uppercase tracking-wider">Total Bookings</th>
                    <th className="text-left px-6 py-3.5 font-semibold text-[#0B0909] text-xs uppercase tracking-wider">Utilized Hours</th>
                    <th className="text-right px-6 py-3.5 font-semibold text-[#0B0909] text-xs uppercase tracking-wider">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {data.rincian_per_tipe_space.map((r: any) => (
                    <tr key={r.tipe} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-6 py-4 font-medium text-[#0B0909]">{r.label}</td>
                      <td className="px-6 py-4 text-[#0B0909] font-mono">{r.total_booking}</td>
                      <td className="px-6 py-4 text-[#0B0909] font-mono">{r.total_jam} hrs</td>
                      <td className="px-6 py-4 text-right font-bold text-[#0B0909] font-mono">
                        Rp {r.total_pendapatan?.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-[#FAFAFA] border-t-2 border-[#E5E5E5]">
                    <td className="px-6 py-4 font-bold text-[#0B0909]">TOTAL</td>
                    <td className="px-6 py-4 text-[#0B0909] font-bold font-mono">{data.total_transaksi}</td>
                    <td className="px-6 py-4 text-[#0B0909] font-bold font-mono">{data.total_jam_terpakai} hrs</td>
                    <td className="px-6 py-4 text-right font-bold text-[#EF6905] font-mono">
                      Rp {data.realisasi_pendapatan_bersih?.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="py-16 flex flex-col items-center justify-center text-center">
                <FileText className="w-10 h-10 text-[#0B0909] mb-3" />
                <h4 className="font-semibold text-[#0B0909]">No ledger data available</h4>
                <p className="text-sm text-[#0B0909] mt-1 max-w-sm">
                  There are no transactions recorded for the selected time period.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <FileText className="w-12 h-12 text-[#0B0909] mb-4" />
          <h3 className="text-lg font-semibold text-[#0B0909]">No data for this period</h3>
          <p className="text-[#0B0909] text-sm mt-1 max-w-sm">
            Try selecting a different month or year to view analytics.
          </p>
        </div>
      )}
    </div>
  );
}
