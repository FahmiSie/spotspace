import { Star, Users, Briefcase } from 'lucide-react';

interface SpaceInfoProps {
  hargaPerJam: number;
  rating: number | null;
  totalReview: number;
  kapasitas: number;
  tipe: string;
  deskripsi: string | null;
}

export function SpaceInfo({ hargaPerJam, rating, totalReview, kapasitas, tipe, deskripsi }: SpaceInfoProps) {
  // Simple formatRupiah fallback if it doesn't exist in utils
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const formatTipe = (t: string) => t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-8">
      {/* Overview stats */}
      <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-stone/50">
        <div className="flex flex-col">
          <span className="text-sm text-ink mb-1">Mulai dari</span>
          <div className="font-display font-semibold text-2xl text-[#EF6905]">
            {formatIDR(hargaPerJam)} <span className="text-base text-ink font-sans font-normal">/ jam</span>
          </div>
        </div>

        <div className="w-px h-10 bg-stone/50 hidden md:block" />

        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-current" />
          <div className="flex flex-col">
            <span className="font-semibold text-ink leading-tight">{rating ? rating.toFixed(1) : 'Baru'}</span>
            <span className="text-xs text-ink underline">{totalReview} ulasan</span>
          </div>
        </div>

        <div className="w-px h-10 bg-stone/50 hidden md:block" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-ink" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-ink leading-tight">{kapasitas} Orang</span>
            <span className="text-xs text-ink">Kapasitas Maksimal</span>
          </div>
        </div>

        <div className="w-px h-10 bg-stone/50 hidden md:block" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone/20 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-ink" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-ink leading-tight">{formatTipe(tipe)}</span>
            <span className="text-xs text-ink">Tipe Ruangan</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h3 className="font-display text-xl font-bold text-ink mb-4">Tentang Ruangan Ini</h3>
        <div className="text-ink leading-relaxed whitespace-pre-wrap">
          {deskripsi || 'Tidak ada deskripsi yang tersedia untuk ruangan ini.'}
        </div>
      </div>
    </div>
  );
}
