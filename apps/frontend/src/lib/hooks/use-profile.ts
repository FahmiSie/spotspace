import { toast } from "@/components/ui/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { useAuthStore } from "../auth-store";

export interface MemberProfile {
  id: number;
  namaMember: string;
  instansi: string | null;
  telp: string;
  foto: string | null;
  user: {
    username: string;
  };
}

export function useMyProfile() {
  const token = useAuthStore(state => state.token);
  const role = useAuthStore(state => state.role);
  return useQuery<MemberProfile>({
    queryKey: ["member", "profile"],
    queryFn: async () => {
      const { data } = await api.get("/member/profile");
      return data;
    },
    enabled: !!token && role === "member",
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore(state => state.setAuth);

  return useMutation({
    mutationFn: async (payload: { name: string; occupation?: string; phone?: string }) => {
      const { data } = await api.put<MemberProfile>("/member/profile", payload);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to process data", type: "error" }); },
    onSuccess: (data) => {
      // Update namaMember in zustand auth store too if it changed
      if (data.namaMember) {
        setAuth({ namaMember: data.namaMember });
      }
      queryClient.invalidateQueries({ queryKey: ["member", "profile"] });
    },
  });
}

export function useUpdateProfileFoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { foto: string }) => {
      const { data } = await api.put<MemberProfile>("/member/profile/foto", payload);
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to update photo", type: "error" }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member", "profile"] });
    },
  });
}
