import { toast } from "@/components/ui/toast";
import { WishlistItem, ToggleWishlistResponse } from "../types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export function useMyWishlist() {
  return useQuery({
    queryKey: ["wishlist", "my"],
    queryFn: async () => {
      const { data } = await api.get<WishlistItem[]>("/wishlist/my");
      return data; // Assumes it returns an array of spaces
    },
  });
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id_space: number) => {
      const { data } = await api.post<ToggleWishlistResponse>("/wishlist", { id_space });
      return data;
    },
    onError: (err: any) => { (toast as any).add({ title: "Error", description: err.response?.data?.message || err.message || "Failed to update wishlist", type: "error" }); },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", "my"] });
      (toast as any).add({ title: data.status === "added" ? "Added to wishlist" : "Removed from wishlist", type: "success" });
    },
  });
}
