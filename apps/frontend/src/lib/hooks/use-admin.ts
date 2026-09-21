import { Member, Space, Diskon, Reservasi, SpaceOwner, SpaceFoto } from "../types";
import { toast } from "@/components/ui/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { useAuthStore } from "../auth-store";

// ============ MEMBERS ============

export function useAdminMembers(search?: string) {
  return useQuery({
    queryKey: ["admin", "members", search],
    queryFn: async () => {
      const { data } = await api.get<Member[]>("/admin/members", { params: search ? { search } : undefined });
      return data;
    },
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post<Member>("/admin/members", payload);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
    },
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put<Member>(`/admin/members/${id}`, payload);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/admin/members/${id}`);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "members"] });
    },
  });
}

// ============ SPACES ============

export function useAdminSpaces() {
  return useQuery({
    queryKey: ["admin", "spaces"],
    queryFn: async () => {
      const { data } = await api.get<Space[]>("/admin/spaces");
      return data;
    },
  });
}

export function useCreateSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post<Space>("/admin/spaces", payload);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "spaces"] });
      qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });
}

export function useUpdateSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put<Space>(`/admin/spaces/${id}`, payload);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "spaces"] });
      qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });
}

export function useDeleteSpace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/admin/spaces/${id}`);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "spaces"] });
      qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });
}

export function useAddSpaceFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ spaceId, url }: { spaceId: number; url: string }) => {
      const { data } = await api.post<SpaceFoto>(`/admin/spaces/${spaceId}/foto`, { url });
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "spaces"] });
      qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });
}

export function useDeleteSpaceFoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ spaceId, fotoId }: { spaceId: number; fotoId: number }) => {
      const { data } = await api.delete(`/admin/spaces/${spaceId}/foto/${fotoId}`);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "spaces"] });
      qc.invalidateQueries({ queryKey: ["spaces"] });
    },
  });
}

// ============ DISKON ============

export function useAdminDiskon() {
  return useQuery({
    queryKey: ["admin", "diskon"],
    queryFn: async () => {
      const { data } = await api.get<Diskon[]>("/admin/diskon");
      return data;
    },
  });
}

export function useCreateDiskon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post<Diskon>("/admin/diskon", payload);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "diskon"] });
    },
  });
}

export function useUpdateDiskon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: any) => {
      const { data } = await api.put<Diskon>(`/admin/diskon/${id}`, payload);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "diskon"] });
    },
  });
}

export function useDeleteDiskon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/admin/diskon/${id}`);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "diskon"] });
    },
  });
}

// ============ RESERVASI (ADMIN) ============

export function useAdminReservasi(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["admin", "reservasi", params],
    queryFn: async () => {
      const { data } = await api.get("/reservasi/admin/all", { params });
      return data;
    },
  });
}

export function useUpdateReservasiStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, alasan }: { id: number; status: string; alasan?: string }) => {
      const { data } = await api.patch(`/reservasi/${id}/status`, { status, alasan });
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservasi"] });
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/reservasi/${id}/check-in`);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservasi"] });
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post(`/reservasi/${id}/check-out`);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reservasi"] });
      qc.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });
}

// ============ REPORTS ============

export function useAdminReports(params?: { bulan?: number; tahun?: number }) {
  return useQuery({
    queryKey: ["admin", "reports", params],
    queryFn: async () => {
      const { data } = await api.get("/admin/reports/monthly", { params });
      return data;
    },
  });
}

// ============ PROFILE LOKASI ============

export function useAdminProfile() {
  const token = useAuthStore(state => state.token);
  const role = useAuthStore(state => state.role);
  return useQuery({
    queryKey: ["admin", "profile"],
    queryFn: async () => {
      const { data } = await api.get<SpaceOwner>("/admin/profile");
      return data;
    },
    enabled: !!token && role === "admin_space",
  });
}

export function useUpdateAdminProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.put<SpaceOwner>("/admin/profile", payload);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "profile"] });
    },
  });
}
