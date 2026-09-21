import Link from "next/link";
import Image from "next/image";
import { Users } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";

interface SpaceCardProps {
  id: number;
  namaSpace: string;
  tipe: string;
  kapasitas: number;
  hargaPerJam: number;
  foto?: string | null;
  owner?: {
    namaCoworking: string;
    kota?: string | null;
  };
  jarakKm?: number;
}

export function SpaceCard({ id, namaSpace, tipe, kapasitas, hargaPerJam, foto, owner, jarakKm }: SpaceCardProps) {
  const imageUrl = foto ? getAssetUrl(foto) : "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80";

  // Format type to display
  const formatTipe = (t: string) => {
    switch (t) {
      case "desk": return "Personal Desk";
      case "meeting_room": return "Meeting Room";
      case "private_office": return "Private Office";
      default: return t;
    }
  };

  return (
    <Link href={`/spaces/${id}`} className="group block">
      <div className="flex flex-col">
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-md bg-stone/20">
          <Image 
            src={imageUrl} 
            alt={namaSpace} 
            fill 
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3 bg-white px-3 py-1.5 text-xs font-semibold text-ink rounded-full">
            {formatTipe(tipe)}
          </div>
          {jarakKm != null && jarakKm < 9999 && (
            <div className="absolute top-3 right-3 bg-orange-50 px-2.5 py-1 text-[11px] font-bold text-orange-600 rounded-full flex items-center gap-1 shadow-sm border border-orange-100">
              📍 {jarakKm.toFixed(1)} km
            </div>
          )}
        </div>
        
        <div className="flex flex-col mt-3">
          <h3 className="font-semibold text-base text-ink leading-tight truncate">
            {namaSpace}
          </h3>
          
          {owner && (
            <div className="flex items-center gap-1.5 text-sm text-ink font-medium truncate mt-0.5">
              <span>{owner.namaCoworking}</span>
              {owner.kota && (
                <>
                  <span className="text-ink">•</span>
                  <span className="text-ink">{owner.kota}</span>
                </>
              )}
            </div>
          )}
          
          <div className="flex items-center text-sm text-ink gap-2 mt-1">
            <span className="flex items-center gap-1 font-medium">
              <span>★</span>
              <span>5.0 (0)</span>
            </span>
            <span className="text-ink">·</span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{kapasitas} guests</span>
            </span>
          </div>
          
          <div className="text-sm text-ink line-clamp-2 mt-1.5 leading-snug">
            A versatile and comfortable space perfect for your next session. Enjoy a productive environment with great amenities... <span className="underline text-ink">Show more</span>
          </div>
          
          <div className="mt-2.5">
            <div className="font-semibold text-base text-ink">
              From Rp {hargaPerJam.toLocaleString("id-ID")}/hr
            </div>
            <div className="text-[11px] text-ink mt-0.5">1 hr min</div>
          </div>
        </div>
      </div>
    </Link>
  );
}