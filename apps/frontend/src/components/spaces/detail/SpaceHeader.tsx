import Link from 'next/link';
import { ChevronLeft, Heart, Share } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SpaceHeaderProps {
  namaSpace: string;
  tipe: string;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
  coworkingName?: string;
  kota?: string | null;
}

export function SpaceHeader({ namaSpace, tipe, isWishlisted, onWishlistToggle, coworkingName, kota }: SpaceHeaderProps) {
  const formatTipe = (t: string) => t.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex flex-col gap-2">
        <Link href="/spaces" className="inline-flex items-center text-sm font-medium text-ink hover:text-ink mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to all spaces
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink">{namaSpace}</h1>
          <Badge variant="default" className="bg-[#EF6905] text-white hover:bg-[#EF6905]/90 rounded-md font-semibold px-3 py-1 shadow-sm">
            {formatTipe(tipe)}
          </Badge>
        </div>
        {coworkingName && (
          <div className="flex items-center gap-1.5 text-base text-ink font-medium mt-1">
            <span>{coworkingName}</span>
            {kota && (
              <>
                <span className="text-ink">•</span>
                <span className="text-ink">{kota}</span>
              </>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="hidden md:flex">
          <Share className="w-4 h-4 mr-2" />
          Share
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onWishlistToggle}
          className={isWishlisted ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100' : ''}
        >
          <Heart className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />
          {isWishlisted ? 'Saved' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
