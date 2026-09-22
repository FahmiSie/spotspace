import { toast } from "@/components/ui/toast";
import { Reservasi } from "../types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export type StatusReservasi =
  | "belum_dikonfirm"
  | "menunggu_persetujuan"
  | "disetujui"
  | "aktif"
  | "selesai"
  | "dibatalkan";

export interface ReservasiListItem {
  id: number;
  kode_booking: string;
  tanggal_reservasi: string;
  jam_mulai: string;
  jam_selesai: string;
  durasi_jam: number;
  total_bayar: number;
  status: StatusReservasi;
  alasanPenolakan?: string;
  payment: {
    status: string;
  } | null;
  space: {
    id: number;
    nama_space: string;
    tipe: string;
  } | null;
}

export interface ETicket {
  e_ticket_number: string;
  kode_booking: string;
  coworking_space: {
    nama: string;
    telepon: string;
  };
  member: {
    nama: string;
    instansi: string | null;
    telp: string;
  };
  space: {
    nama: string;
    tipe: string;
    harga_per_jam: number;
  };
  jadwal: {
    tanggal: string;
    jam_mulai: string;
    jam_selesai: string;
    durasi: string;
  };
  rincian_pembayaran: {
    tarif_kotor: number;
    diskon_promo: string | null;
    potongan: number;
    total_dibayar: number;
  };
  status_reservasi: StatusReservasi;
  qr_code: string;
}

export function useMyReservasi() {
  return useQuery<ReservasiListItem[]>({
    queryKey: ["reservasi", "my"],
    queryFn: async () => {
      // Base URL di interceptor sudah ditambah /api, jadi panggil /reservasi/my
      const { data } = await api.get("/reservasi/my");
      return data;
    },
  });
}

export function useETicket(id: number) {
  return useQuery<ETicket>({
    queryKey: ["reservasi", id, "e-ticket"],
    queryFn: async () => {
      const { data } = await api.get(`/reservasi/${id}/e-ticket`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCancelReservasi() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<Reservasi>(`/reservasi/${id}/cancel`);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to cancel reservation", type: "error" }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservasi", "my"] });
      queryClient.invalidateQueries({ queryKey: ["reservasi"] });
    },
  });
}

export function useChargeQris() {
  return useMutation({
    mutationFn: async (kodeBooking: string) => {
      const { data } = await api.post("/payment/charge", { kodeBooking });
      return data;
    },
    onError: (err: any) => {
      (toast as any).add({
        title: "Payment Error",
        description: err.response?.data?.message || err.message || "Failed to initiate payment",
        type: "error",
      });
    },
  });
}

export function useSnapToken() {
  return useMutation({
    mutationFn: async (kodeBooking: string) => {
      const { data } = await api.post("/payment/snap-token", { kodeBooking });
      return data;
    },
    onError: (err: any) => {
      (toast as any).add({
        title: "Payment Error",
        description: err.response?.data?.message || err.message || "Failed to initiate payment",
        type: "error",
      });
    },
  });
}
