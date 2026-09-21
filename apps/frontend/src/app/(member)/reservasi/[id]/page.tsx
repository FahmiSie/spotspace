"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { toast } from "@/components/ui/toast";
import { ArrowLeft, Ticket, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useETicket, useSnapToken } from "@/lib/hooks/use-reservasi";
import { Button } from "@/components/ui/button";

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { data: ticket, isLoading, error } = useETicket(parseInt(unwrappedParams.id));
  const snapToken = useSnapToken();
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleCheckStatus = async () => {
    if (!ticket?.kode_booking) return;
    try {
      const { data } = await api.get(`/payment/status/${ticket.kode_booking}`);
      
      if (data.isPaid) {
        (toast as any).add({ title: "Payment verified successfully!", type: "success" });
        router.push('/reservasi');
      } else {
        (toast as any).add({ title: "Payment not detected yet. Please complete payment.", type: "warning" });
      }
    } catch (err) {
      console.error(err);
      (toast as any).add({ title: "Failed to verify payment status.", type: "error" });
    }
  };

  const handlePay = async () => {
    if (!ticket?.kode_booking) return;
    try {
      const { token } = await snapToken.mutateAsync(ticket.kode_booking);
      (window as any).snap.pay(token, {
        onSuccess: async function (result: any) {
          try {
            await api.get(`/payment/status/${ticket.kode_booking}`);
            await queryClient.invalidateQueries({ queryKey: ['reservasi'] });
            await queryClient.invalidateQueries({ queryKey: ['reservasi', ticket.kode_booking] });
            (toast as any).add({ title: "Payment successful! Awaiting admin approval.", type: "success" });
          } catch (err) {
            console.error("Failed to sync status:", err);
          } finally {
            router.push('/reservasi');
          }
        },
        onPending: async function (result: any) {
          await queryClient.invalidateQueries({ queryKey: ['reservasi'] });
          (toast as any).add({ title: "Waiting for payment completion.", type: "info" });
          router.push('/reservasi');
        },
        onError: function (result: any) {
          (toast as any).add({ title: "Payment failed.", type: "error" });
        },
        onClose: async function () {
          try {
            await api.get(`/payment/status/${ticket.kode_booking}`);
            await queryClient.invalidateQueries({ queryKey: ['reservasi'] });
          } catch (e) {}
          router.push('/reservasi');
        },
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 md:p-12 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-48 mb-8"></div>
        <div className="h-64 bg-stone-200 rounded-xl mb-4"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 md:p-12 text-center">
        <h2 className="text-2xl font-bold text-ink mb-4">Reservation Not Found</h2>
        <Link href="/reservasi">
          <Button variant="default" className="bg-ink text-white rounded-xl">Back to Reservations</Button>
        </Link>
      </div>
    );
  }

  const isPending = ticket.status_reservasi === "belum_dikonfirm";

  return (
    <div className="w-full min-h-screen bg-stone-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-6">
          <Link href="/reservasi" className="text-ink hover:text-ink transition-colors flex items-center gap-2 font-medium mb-6">
            <ArrowLeft className="w-5 h-5" />
            Back to Reservations
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-3xl text-ink">
                {isPending ? "Booking Summary & Payment" : "Reservation Details"}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-stone-100 border border-stone-200 text-ink text-xs font-mono px-2 py-1 rounded">
                  {ticket.kode_booking}
                </span>
                {isPending && (
                  <span className="bg-stone-200 text-stone-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide">
                    Status: Pending Payment
                  </span>
                )}
              </div>
            </div>
            
            {!isPending && (
              <Link href={`/reservasi/${unwrappedParams.id}/e-ticket`}>
                <Button className="bg-[#EF6905] hover:bg-[#EF6905]/90 text-white rounded-xl px-6 flex items-center gap-2 h-12 shadow-sm font-bold w-full md:w-auto">
                  <Ticket className="w-5 h-5" />
                  View E-Ticket
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 md:px-12 py-8 mt-4 space-y-8">
        
        {/* Reservation Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-6">Reservation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Space</p>
                <p className="font-bold text-lg text-ink">{ticket.space.nama}</p>
                <p className="text-stone-500 text-sm">{ticket.coworking_space.nama} &bull; {ticket.space.tipe}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Schedule</p>
                <p className="font-medium text-ink">
                  {new Date(ticket.jadwal.tanggal).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-stone-500 text-sm">{ticket.jadwal.jam_mulai} - {ticket.jadwal.jam_selesai} ({ticket.jadwal.durasi})</p>
              </div>
            </div>

            <div className="bg-stone-50 p-5 rounded-xl border border-stone-200 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">Payment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Base Rate</span>
                    <span className="font-medium text-ink">Rp {ticket.rincian_pembayaran.tarif_kotor.toLocaleString('id-ID')}</span>
                  </div>
                  {ticket.rincian_pembayaran.potongan > 0 && (
                    <div className="flex justify-between text-[#EF6905]">
                      <span>Discount</span>
                      <span className="font-medium">-Rp {ticket.rincian_pembayaran.potongan.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-stone-200 flex justify-between items-end">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  {isPending ? "Amount" : "Total Paid"}
                </span>
                <span className="font-display text-2xl font-bold text-ink">
                  Rp {ticket.rincian_pembayaran.total_dibayar.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Midtrans Snap Payment */}
        {isPending && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-8 text-center space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Complete Your Payment</h2>
              <p className="text-stone-500 text-sm mt-2 max-w-2xl mx-auto">
                Click the button below to open the secure payment popup from Midtrans. You can choose payment methods such as GoPay, QRIS, Virtual Account, etc.
              </p>
            </div>

            <div className="pt-6 border-t border-stone-200 flex flex-col md:flex-row items-center justify-center gap-4">
              <Button 
                onClick={handlePay} 
                disabled={snapToken.isPending}
                className="bg-[#EF6905] hover:bg-[#EF6905]/90 text-white rounded-xl px-12 h-14 font-bold shadow-sm w-full md:w-auto text-lg"
              >
                {snapToken.isPending ? "Loading..." : "Pay Now"}
              </Button>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-4">
              <Button onClick={handleCheckStatus} variant="ghost" className="text-stone-500 hover:text-ink">
                Check Payment Status
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
