"use client";

import { useMyWishlist } from "@/lib/hooks/use-wishlist";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";

export default function WishlistPage() {
  const { data: wishlist, isLoading, error } = useMyWishlist();

  return (
    <div className="min-h-screen bg-white py-12 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-[#222222] mb-8">Wishlists</h1>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="w-full aspect-square rounded-3xl" />
                <Skeleton className="w-3/4 h-5" />
                <Skeleton className="w-1/2 h-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl">
            Failed to load wishlist data.
          </div>
        ) : !wishlist || wishlist.length === 0 ? (
          <div className="border border-stone/20 p-16 text-center rounded-3xl flex flex-col items-center mt-8">
            <Heart className="w-16 h-16 text-stone/50 mb-4" />
            <h2 className="text-xl font-bold text-ink mb-2">No Wishlists Yet</h2>
            <p className="text-ink mb-6">You haven't saved any workspaces to your wishlist yet.</p>
            <Link href="/spaces" className="bg-ink hover:bg-ink/90 text-white px-6 py-3 rounded-xl font-bold transition-colors">
              Explore Spaces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-10 mt-8">
            {wishlist.map((item: any) => {
              const space = item.space;
              
              // We mimic the Airbnb "Wishlist" collection card look by using 
              // the space's photo as the full cover of the square card.
              return (
                <Link href={`/spaces/${space.id}`} key={item.id} className="group cursor-pointer">
                  {/* Card Image */}
                  <div className="w-full aspect-square rounded-[1.5rem] overflow-hidden mb-3 relative bg-stone/10 shadow-sm border border-stone/10 transition-transform group-hover:scale-[1.02]">
                    {space.foto ? (
                      <img 
                        src={getAssetUrl(space.foto)} 
                        alt={space.nama_space} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Card Text */}
                  <div>
                    <h3 className="font-semibold text-[15px] text-[#222222]">
                      {space.nama_space}
                    </h3>
                    <p className="text-[14px] text-[#717171] mt-0.5">
                      {space.owner?.nama_coworking || "Coworking Space"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
