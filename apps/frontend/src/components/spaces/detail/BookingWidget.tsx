'use client';

import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Minus, CheckCircle2, AlertCircle } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { checkAvailability, checkDiscount } from '@/lib/api/spaces';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

const bookingSchema = z.object({
  tanggal: z.date(),
  jam_mulai: z.string(),
  durasi: z.number().min(1, 'Minimal 1 jam'),
  kode_promo: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingWidgetProps {
  spaceId: number;
  hargaPerJam: number;
}

export function BookingWidget({ spaceId, hargaPerJam }: BookingWidgetProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);
  const [availability, setAvailability] = useState<{ available: boolean; message?: string } | null>(null);
  const [discountInfo, setDiscountInfo] = useState<{ id: number; persentase: number; potongan: number } | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      durasi: 1,
      kode_promo: '',
    },
  });

  const { watch, setValue, handleSubmit } = form;
  const tanggal = watch('tanggal');
  const jamMulai = watch('jam_mulai');
  const durasi = watch('durasi');
  const kodePromo = watch('kode_promo');

  // Debounced Availability Check
  useEffect(() => {
    if (!tanggal || !jamMulai || !durasi) return;

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await checkAvailability({
          id_space: spaceId,
          tanggal: format(tanggal, 'yyyy-MM-dd'),
          jam_mulai: jamMulai,
          durasi_jam: durasi,
        });
        setAvailability({ available: res.available });
      } catch (err: any) {
        setAvailability({ 
          available: false, 
          message: err.response?.data?.message || 'Slot waktu tidak tersedia atau bentrok.' 
        });
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [spaceId, tanggal, jamMulai, durasi]);

  const handleApplyPromo = async () => {
    if (!kodePromo) return;
    setCheckingDiscount(true);
    setDiscountError('');
    try {
      const res = await checkDiscount(kodePromo);
      // Kalkulasi potongan = persentase * total harga awal
      const totalAwal = hargaPerJam * durasi;
      const potongan = (res.persentaseDiskon / 100) * totalAwal;
      setDiscountInfo({
        id: res.id,
        persentase: res.persentaseDiskon,
        potongan,
      });
    } catch (err: any) {
      setDiscountInfo(null);
      setDiscountError(err.response?.data?.message || 'Kode promo tidak valid');
    } finally {
      setCheckingDiscount(false);
    }
  };

  const onSubmit = async (data: BookingFormValues) => {
    if (!token) {
      router.push('/auth/login?redirect=/spaces/' + spaceId);
      return;
    }
    
    setIsSubmitting(true);
    const payload = {
      id_space: Number(spaceId),
      tanggal_reservasi: format(data.tanggal, 'yyyy-MM-dd'),
      jam_mulai: data.jam_mulai,
      durasi_jam: Number(data.durasi),
      ...(discountInfo?.id ? { id_diskon: discountInfo.id, kode_promo: kodePromo } : {}),
    };
    console.log("Submitting booking with payload:", payload);
    
    try {
      const res = await api.post('/reservasi', payload);
      
      (toast as any).add({ title: "Reservation submitted successfully!", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["reservasi", "my"] });
      
      const newId = res?.data?.id;
      if (newId) {
        router.push(`/reservasi/${newId}`);
      } else {
        router.push('/reservasi');
      }
    } catch (error: any) {
      console.error("Booking failed:", error);
      const msg = error?.response?.data?.message || error?.message || "Failed to submit reservation.";
      (toast as any).add({ 
        title: "Error", 
        description: Array.isArray(msg) ? msg.join(", ") : msg, 
        type: "error" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kalkulasi Harga
  const totalAwal = hargaPerJam * durasi;
  const potongan = discountInfo ? (discountInfo.persentase / 100) * totalAwal : 0;
  const totalBayar = totalAwal - potongan;

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Time slots generation (simple 08:00 to 22:00)
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const isFormComplete = !!tanggal && !!jamMulai && durasi > 0;
  const isAvailable = availability?.available === true;
  const canSubmit = isFormComplete && isAvailable && !isChecking;

  return (
    <div className="bg-white border border-stone rounded-2xl p-6 shadow-sm sticky top-24">
      <h3 className="font-display font-semibold text-2xl text-ink mb-6">
        {formatIDR(hargaPerJam)} <span className="text-base text-ink font-sans font-normal">/ hour</span>
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-ink">Date</label>
            <Popover>
              <PopoverTrigger className={buttonVariants({ variant: 'outline', className: `w-full justify-start text-left font-normal ${!tanggal ? 'text-muted-foreground' : ''}` })}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {tanggal ? format(tanggal, 'PPP') : <span>Select date</span>}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={tanggal}
                  onSelect={(date) => setValue('tanggal', date as Date)}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink">Start Time</label>
              <Select onValueChange={(val: string | null) => { if (val) setValue('jam_mulai', val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-ink">Duration (Hours)</label>
              <div className="flex items-center justify-between border border-stone rounded-md h-10 px-3">
                <button type="button" onClick={() => setValue('durasi', Math.max(1, durasi - 1))} className="text-ink hover:text-ink disabled:opacity-50" disabled={durasi <= 1}>
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-medium text-sm">{durasi}</span>
                <button type="button" onClick={() => setValue('durasi', Math.min(24, durasi + 1))} className="text-ink hover:text-ink disabled:opacity-50" disabled={durasi >= 24}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Ketersediaan */}
        {isFormComplete && (
          <div className={`p-3 rounded-md flex items-start gap-2 text-sm ${
            isChecking ? 'bg-stone/10 text-ink' :
            isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {isChecking ? (
              <div className="w-4 h-4 rounded-full border-2 border-stone/30 border-t-stone/60 animate-spin mt-0.5" />
            ) : isAvailable ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>
              {isChecking ? 'Checking availability...' : 
               isAvailable ? 'Slot available! Proceed.' : 
               (availability?.message || 'Slot unavailable.')}
            </span>
          </div>
        )}

        <div className="pt-4 border-t border-stone/50 space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Promo Code (optional)" 
              value={kodePromo || ''}
              onChange={(e) => setValue('kode_promo', e.target.value)}
              className="uppercase"
            />
            <Button type="button" variant="outline" onClick={handleApplyPromo} disabled={!kodePromo || checkingDiscount}>
              Use
            </Button>
          </div>
          {discountError && <p className="text-xs text-red-500">{discountError}</p>}
          {discountInfo && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Promo Code Applied {discountInfo.persentase}%
            </p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink">
              <span>{formatIDR(hargaPerJam)} x {durasi} hour{durasi > 1 ? 's' : ''}</span>
              <span>{formatIDR(totalAwal)}</span>
            </div>
            {discountInfo && (
              <div className="flex justify-between text-green-600">
                <span>Promo Discount</span>
                <span>-{formatIDR(potongan)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-ink pt-2 border-t border-stone/30">
              <span>Amount</span>
              <span>{formatIDR(totalBayar)}</span>
            </div>
          </div>
        </div>

        <Button 
          type="button" 
          onClick={handleSubmit(onSubmit)}
          className="w-full bg-[#EF6905] hover:bg-[#D55A03] text-white py-6 text-base font-semibold"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Make Reservation'}
        </Button>
      </form>
    </div>
  );
}
