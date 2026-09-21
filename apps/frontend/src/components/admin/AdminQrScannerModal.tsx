import React, { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, QrCode, ScanLine, Loader2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";

interface AdminQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminQrScannerModal({ isOpen, onClose, onSuccess }: AdminQrScannerModalProps) {
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setManualCode("");
      setErrorMsg("");
      return;
    }

    let isMounted = true;
    let scannerInstance: Html5Qrcode | null = null;

    const startScanner = async () => {
      try {
        const el = document.getElementById('qr-reader');
        if (!el) return;
        scannerInstance = new Html5Qrcode('qr-reader');
        scannerRef.current = scannerInstance;

        await scannerInstance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (isMounted) handleScanSuccess(decodedText);
          },
          () => {} // Abaikan per-frame error
        );
      } catch (err) {
        if (isMounted) console.warn('Scanner init failed:', err);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (scannerInstance) {
        const cleanup = async () => {
          try {
            if (scannerInstance!.isScanning) {
              await scannerInstance!.stop();
            }
          } catch (e) {
            console.warn('Error stopping scanner:', e);
          } finally {
            try {
              scannerInstance!.clear();
            } catch (e) {}
            scannerRef.current = null;
          }
        };
        cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 800; // Hz
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume
      oscillator.start();
      setTimeout(() => oscillator.stop(), 100); // 100ms duration
    } catch (e) {
      // Ignore audio errors
    }
  };

  const processScan = async (code: string) => {
    if (loading || !code) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // Pause scanner if active
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.pause();
      }

      playBeep();
      const { data } = await api.post("/reservasi/admin/scan", { code });
      
      const isCheckIn = data?.action === 'check_in';
      const actionTitle = isCheckIn ? "CHECKED-IN" : "CHECKED-OUT";
      
      (toast as any).add({
        title: actionTitle,
        description: isCheckIn ? "Check-in successful! Session is now active." : "Check-out successful! Reservation completed.",
        type: "success",
      });

      if (onSuccess) onSuccess();
      
      // Close modal on success
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error: any) {
      setErrorMsg("Invalid or expired ticket.");
      // Resume scanner to try again
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.resume();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    processScan(decodedText);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScan(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone/20">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-ink" />
            <h3 className="font-semibold text-lg text-ink">Scan QR E-Ticket</h3>
          </div>
          <button onClick={onClose} className="p-1 text-ink hover:text-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Area */}
        <div className="relative bg-black flex-1 min-h-[300px] flex items-center justify-center">
          <div id="qr-reader" className="w-full h-full" />
          {/* Overlay frame (just visual) */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-orange-500/50 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 -mt-1 -ml-1 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 -mt-1 -mr-1 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 -mb-1 -ml-1 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 -mb-1 -mr-1 rounded-br-xl" />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="bg-red-50 px-6 py-3 flex items-start gap-3 border-b border-red-100">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Fallback Manual Input */}
        <div className="p-6 bg-stone-50">
          <p className="text-sm text-center text-ink mb-3 font-medium">Or enter Booking Code (BOOK-...)</p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. BOOK-2026..."
              className="flex-1 px-4 py-2 rounded-xl border border-stone/30 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 uppercase font-mono text-sm"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
            />
            <button 
              type="submit" 
              disabled={loading || !manualCode}
              className="px-6 py-2 bg-ink hover:bg-ink/90 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
