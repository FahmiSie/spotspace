'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getSpace } from '@/lib/api/spaces';
import { useMyWishlist, useToggleWishlist } from '@/lib/hooks/use-wishlist';
import { useAuthStore } from '@/lib/auth-store';

import { SpaceHeader } from '@/components/spaces/detail/SpaceHeader';
import { SpaceGallery } from '@/components/spaces/detail/SpaceGallery';
import { SpaceInfo } from '@/components/spaces/detail/SpaceInfo';
import { LocationMap } from '@/components/spaces/detail/LocationMap';
import { ReviewSection } from '@/components/spaces/detail/ReviewSection';
import { BookingWidget } from '@/components/spaces/detail/BookingWidget';

export default function SpaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const spaceId = Number(params.id);
  const { token, role } = useAuthStore();

  const { data: space, isLoading, error } = useQuery({
    queryKey: ['space', spaceId],
    queryFn: () => getSpace(spaceId),
    retry: false, // Don't retry on 404
  });

  // Wishlist: only fetch when logged in as member
  const { data: wishlistData } = useMyWishlist();
  const toggleWishlist = useToggleWishlist();

  const isMember = !!token && role === 'member';
  const isWishlisted = isMember && Array.isArray(wishlistData) 
    ? wishlistData.some((item: any) => item.id_space === spaceId || item.space?.id === spaceId) 
    : false;

  const handleWishlistToggle = () => {
    if (!isMember) {
      router.push('/auth/login?redirect=/spaces/' + spaceId);
      return;
    }
    toggleWishlist.mutate(spaceId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#EF6905]/30 border-t-[#EF6905] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <h1 className="font-display text-4xl font-bold text-ink mb-4">Space Not Found</h1>
        <p className="text-ink mb-8 text-center max-w-md">
          Sorry, the space you are looking for does not exist or may have been removed.
        </p>
        <button 
          onClick={() => router.push('/spaces')}
          className="bg-[#EF6905] text-white px-6 py-3 rounded-full font-medium"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-32">
      <main className="max-w-7xl mx-auto px-6 md:px-12 pt-8 md:pt-12">
        <SpaceHeader 
          namaSpace={space.namaSpace} 
          tipe={space.tipe} 
          isWishlisted={isWishlisted}
          onWishlistToggle={handleWishlistToggle}
          coworkingName={space.owner?.namaCoworking}
          kota={space.owner?.kota}
        />
        
        <SpaceGallery 
          namaSpace={space.namaSpace}
          mainFoto={space.foto}
          fotoGaleri={space.foto_galeri || []}
        />

        <div className="flex flex-col lg:flex-row gap-12 relative">
          <div className="flex-1 w-full lg:w-2/3">
            <SpaceInfo 
              hargaPerJam={space.hargaPerJam}
              rating={space.rating_rata_rata}
              totalReview={space.total_review || 0}
              kapasitas={space.kapasitas}
              tipe={space.tipe}
              deskripsi={space.deskripsi}
            />

            <LocationMap 
              alamat={space.owner?.alamat}
            />

            <ReviewSection spaceId={spaceId} />
          </div>

          <div className="w-full lg:w-1/3 mt-8 lg:mt-0 relative">
            <div className="sticky top-24 z-10">
              <BookingWidget 
                spaceId={spaceId}
                hargaPerJam={space.hargaPerJam}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
