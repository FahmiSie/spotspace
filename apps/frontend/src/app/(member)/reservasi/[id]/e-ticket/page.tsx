"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ArrowLeft, Download, Share2, AlertCircle, Loader2 } from "lucide-react";
import { useETicket, StatusReservasi } from "@/lib/hooks/use-reservasi";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { toPng } from "html-to-image";

const STATUS_STYLES: Record<StatusReservasi, string> = {
  belum_dikonfirm: "bg-[#E0A438]/10 text-[#E0A438] border-[#E0A438]/20",
  disetujui: "bg-[#2F5D50]/10 text-[#2F5D50] border-[#2F5D50]/20",
  aktif: "bg-[#3B5BA5]/10 text-[#3B5BA5] border-[#3B5BA5]/20",
  selesai: "bg-[#6B665A]/10 text-[#6B665A] border-[#6B665A]/20",
  dibatalkan: "bg-[#B0523A]/10 text-[#B0523A] border-[#B0523A]/20",
};

const STATUS_LABELS: Record<StatusReservasi, string> = {
  belum_dikonfirm: "Pending Approval",
  disetujui: "Approved",
  aktif: "Active",
  selesai: "Completed",
  dibatalkan: "Cancelled",
};

export default function ETicketPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { data: ticket, isLoading, error } = useETicket(parseInt(unwrappedParams.id));

  const ticketCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadTicket = useCallback(async () => {
    if (!ticketCardRef.current || !ticket) return;
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(ticketCardRef.current, {
        cacheBust: true,
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });

      const link = document.createElement('a');
      const fileName = `SpotSpace-Ticket-${ticket.kode_booking || 'pass'}.png`;
      link.download = fileName;
      link.href = dataUrl;
      link.click();

      (toast as any).add({ title: "E-Ticket downloaded successfully!", type: "success" });
    } catch (error) {
      console.error('Failed to export ticket image:', error);
      (toast as any).add({ title: "Failed to generate ticket image. Please try again.", type: "error" });
    } finally {
      setIsDownloading(false);
    }
  }, [ticket]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'E-Ticket SpotSpace',
          text: `E-Ticket for ${ticket?.space.nama} at ${ticket?.coworking_space.nama}`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-[#121212] flex items-center justify-center p-6">
        <Skeleton className="w-full max-w-md h-[600px] rounded-3xl" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="w-full min-h-screen bg-[#121212] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl text-ink mb-2">Ticket Not Found</h2>
          <p className="text-ink mb-6">This reservation may not exist or you don't have access.</p>
          <Link href="/reservasi">
            <Button className="w-full bg-ink text-white font-bold rounded-xl">Back to Reservations</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isPaidOrApproved = ticket.status_reservasi === 'disetujui' || ticket.status_reservasi === 'selesai' || ticket.status_reservasi === 'aktif';

  return (
    <div className="w-full min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 md:p-12">
      {/* Top Nav */}
      <div className="w-full max-w-md mb-8 flex justify-between items-center">
        <Link href="/reservasi" className="text-white/60 hover:text-white transition-colors flex items-center gap-2 font-medium">
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
        <span className="text-white font-bold tracking-widest uppercase text-sm">
          E-Ticket
        </span>
      </div>

      {/* Ticket Card */}
      <div ref={ticketCardRef} className="w-full max-w-md bg-white rounded-[2rem] overflow-hidden shadow-2xl relative">
        {/* Ticket Header */}
        <div className="bg-ink p-8 text-center text-white relative">
          <h2 className="font-display font-bold text-2xl mb-1">{ticket.coworking_space.nama}</h2>
          <p className="text-white/60 text-sm font-medium">{ticket.space.nama}</p>
          
          {/* Jagged edge effect (Optional via CSS or SVG in the future) */}
          <div className="absolute -bottom-3 left-0 w-full flex justify-around overflow-hidden h-6 opacity-20">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-white rounded-full -mt-2"></div>
            ))}
          </div>
        </div>

        {/* Status Badge Overlap */}
        <div className="absolute top-[80px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm bg-white ${STATUS_STYLES[ticket.status_reservasi]}`}>
            {STATUS_LABELS[ticket.status_reservasi]}
          </span>
        </div>

        {/* QR Code Section */}
        <div className="p-8 pt-12 flex flex-col items-center border-b border-stone border-dashed relative">
          {/* Cutouts for boarding pass look */}
          <div className="absolute -left-4 bottom-0 translate-y-1/2 w-8 h-8 bg-[#121212] rounded-full"></div>
          <div className="absolute -right-4 bottom-0 translate-y-1/2 w-8 h-8 bg-[#121212] rounded-full"></div>

          {ticket.status_reservasi === 'selesai' ? (
            <div className="w-48 h-48 mx-auto rounded-xl border-2 border-stone-200 bg-stone-50 flex flex-col items-center justify-center p-4 text-center mb-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center">
                <div className="border-4 border-stone-800 text-stone-800 px-3 py-1 rounded-lg transform -rotate-12 font-bold tracking-widest text-lg mb-2">COMPLETED</div>
                <span className="text-[10px] font-semibold text-stone-600 bg-white/80 px-2 py-1 rounded">Checked Out</span>
              </div>
              <Image src={ticket.qr_code} alt="QR Code" width={160} height={160} unoptimized className="w-40 h-40 opacity-20 grayscale" />
            </div>
          ) : ticket.status_reservasi === 'aktif' || ticket.status_reservasi === 'disetujui' ? (
            <div className="p-4 bg-white border border-stone rounded-2xl shadow-sm mb-4 relative">
              {ticket.status_reservasi === 'aktif' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1967D2] text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-md z-20">
                  Active Pass
                </div>
              )}
              <Image 
                src={ticket.qr_code} 
                alt="QR Code Ticket" 
                width={160} 
                height={160}
                unoptimized
                className="w-40 h-40 relative z-10"
              />
            </div>
          ) : (
            <div className="w-48 h-48 mx-auto rounded-xl border border-dashed border-stone-300 bg-stone-50 flex flex-col items-center justify-center p-4 text-center mb-4">
              <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Ticket Not Active</span>
              <p className="text-[10px] text-stone-500">Check-in QR will appear once payment is approved.</p>
            </div>
          )}
          
          <p className="font-mono font-bold text-xl tracking-[0.2em] text-ink">{ticket.kode_booking}</p>
          <p className="text-ink text-xs font-medium mt-1 text-center max-w-[200px]">
            {ticket.status_reservasi === 'disetujui' ? "Present this QR code upon arrival to check in." :
             ticket.status_reservasi === 'aktif' ? "Pass active. Present this QR code when leaving to check out." :
             ticket.status_reservasi === 'selesai' ? "Session completed. Thank you for visiting!" :
             "Waiting for payment"}
          </p>
        </div>

        {/* Details Section */}
        <div className="p-8 bg-paper/50">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
            <div>
              <p className="text-ink text-xs font-bold uppercase tracking-wider mb-1">Booking Date</p>
              <p className="font-semibold text-ink text-sm">
                {new Date(ticket.jadwal.tanggal).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-ink text-xs font-bold uppercase tracking-wider mb-1">Duration</p>
              <p className="font-semibold text-ink text-sm">{ticket.jadwal.durasi}</p>
            </div>
            <div>
              <p className="text-ink text-xs font-bold uppercase tracking-wider mb-1">Check-in</p>
              <p className="font-display font-bold text-2xl text-ink">{ticket.jadwal.jam_mulai}</p>
            </div>
            <div>
              <p className="text-ink text-xs font-bold uppercase tracking-wider mb-1">Check-out</p>
              <p className="font-display font-bold text-2xl text-ink">{ticket.jadwal.jam_selesai}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-stone text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-ink">Rate ({ticket.jadwal.durasi})</span>
              <span className="font-semibold">Rp {ticket.rincian_pembayaran.tarif_kotor.toLocaleString('id-ID')}</span>
            </div>
            {ticket.rincian_pembayaran.potongan > 0 && (
              <div className="flex justify-between mb-2 text-flame">
                <span>Discount {ticket.rincian_pembayaran.diskon_promo}</span>
                <span className="font-semibold">-Rp {ticket.rincian_pembayaran.potongan.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between mt-4 pt-4 border-t border-stone font-bold">
              <span className="text-ink">{isPaidOrApproved ? "Total Paid" : "Total Due"}</span>
              <span className="text-ink text-lg">Rp {ticket.rincian_pembayaran.total_dibayar.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md mt-8 flex gap-4">
        <Button 
          variant="outline" 
          className="flex-1 rounded-xl bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <button 
          onClick={handleDownloadTicket}
          disabled={isDownloading}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer"
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin"/>
              <span>Generating Image...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4"/>
              <span>Download E-Ticket</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
