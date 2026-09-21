'use client';

import { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { SpaceCard } from "@/components/spaces/space-card";
import { MapPin, ChevronDown, X } from "lucide-react";
import { api } from '@/lib/api';
import { toast } from "@/components/ui/toast";
import { getCoordinatesFromPlusCode, calculateDistance } from '@/lib/utils/location';

const SPACE_TYPES = [
  { tipe: '', label: 'Any' },
  { tipe: 'desk', label: 'Personal Desk' },
  { tipe: 'meeting_room', label: 'Meeting Room' },
  { tipe: 'private_office', label: 'Private Office' },
];

const CAPACITY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '5', label: '5+' },
  { value: '10', label: '10+' },
  { value: '20', label: '20+' },
];

const PRICE_OPTIONS = [
  { min: '', max: '', label: 'Any' },
  { min: '0', max: '50000', label: '< Rp 50k' },
  { min: '50000', max: '100000', label: 'Rp 50k–100k' },
  { min: '100000', max: '200000', label: 'Rp 100k–200k' },
  { min: '200000', max: '', label: '> Rp 200k' },
];

interface Filters {
  tipe: string;
  min_kapasitas: string;
  min_harga: string;
  max_harga: string;
  search: string;
  lat: string;
  lng: string;
  radius: string;
  sort: string;
}

const defaultFilters: Filters = {
  tipe: '',
  min_kapasitas: '',
  min_harga: '',
  max_harga: '',
  search: '',
  lat: '',
  lng: '',
  radius: '',
  sort: '',
};

function SpacesCatalogInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [filters, setFilters] = useState<Filters>(() => ({
    ...defaultFilters,
    search: searchParams.get('search') || '',
    tipe: searchParams.get('type') || searchParams.get('tipe') || '',
  }));
  const [nearestActive, setNearestActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Sync search from URL (e.g. from navbar)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setFilters(prev => {
      if (prev.search !== urlSearch) {
        // If search changed from URL (like navbar push), and there's a new search,
        // we should reset other filters to prevent confusion, unless they are also in URL.
        // Since navbar only pushes ?search=..., this will effectively reset other local filters
        // if we just reset them. But let's just update search for now and let the user keep filters
        // if they had them. Wait, user specifically requested:
        // "RESET filter lain saat search baru dari navbar"
        // We can check if URL ONLY has 'search' (and maybe 'loc').
        const hasOtherParams = Array.from(searchParams.keys()).some(k => k !== 'search' && k !== 'loc');
        if (!hasOtherParams && urlSearch !== '') {
           return { ...defaultFilters, search: urlSearch };
        }
        return { ...prev, search: urlSearch };
      }
      return prev;
    });
  }, [searchParams]);

  // Debounce search typing to URL
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      const currentUrlSearch = searchParams.get('search') || '';
      if (filters.search !== currentUrlSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (filters.search) {
          params.set('search', filters.search);
        } else {
          params.delete('search');
        }
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search, router, searchParams]);

  const buildParams = useCallback(() => {
    const params: Record<string, string> = {};
    if (filters.tipe) params.tipe = filters.tipe;
    if (filters.search) params.search = filters.search;
    if (filters.min_kapasitas) params.min_kapasitas = filters.min_kapasitas;
    if (filters.min_harga) params.min_harga = filters.min_harga;
    if (filters.max_harga) params.max_harga = filters.max_harga;
    // Nearest sorting happens on the frontend now
    return params;
  }, [filters]);

  const { data: spaces = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['spaces', filters],
    queryFn: async () => {
      const { data } = await api.get('/spaces', { params: buildParams() });
      return data;
    },
  });

  const displaySpaces = useMemo(() => {
    let list = [...spaces];

    if (nearestActive && userCoords) {
      list = list
        .map((space) => {
          const cafeCoords = space.owner?.latitude && space.owner?.longitude 
            ? { lat: Number(space.owner.latitude), lng: Number(space.owner.longitude) }
            : getCoordinatesFromPlusCode(space.owner?.alamat || '');

          const distance = cafeCoords 
            ? calculateDistance(userCoords.lat, userCoords.lng, cafeCoords.lat, cafeCoords.lng)
            : 9999;

          return { ...space, distance };
        })
        .sort((a, b) => a.distance - b.distance);
    }

    return list;
  }, [spaces, nearestActive, userCoords]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-filter-dropdown]')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleNearestToggle = async () => {
    if (nearestActive) {
      // Turn off
      setNearestActive(false);
      setUserCoords(null);
      setGeoError('');
      return;
    }

    // Request geolocation
    if (!navigator.geolocation) {
      (toast as any).add({ title: "Error", description: "Browser Anda tidak mendukung deteksi lokasi.", type: "error" });
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError('');
    const loadingToastId = (toast as any).add({ title: "Mengambil lokasi Anda...", type: "loading" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        (toast as any).update(loadingToastId, { title: "Menampilkan space terdekat dari lokasi Anda.", type: "success" });
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setNearestActive(true);
        setGeoLoading(false);
      },
      (err) => {
        (toast as any).update(loadingToastId, { title: "Gagal", description: err.code === 1 ? "Izin akses lokasi ditolak." : "Gagal mendapatkan lokasi.", type: "error" });
        setGeoError(
          err.code === 1
            ? 'Location access denied. Please allow location permission and try again.'
            : 'Unable to get your location. Please try again.'
        );
        setNearestActive(false);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Get display labels for current filter values
  const currentTypeLabel = SPACE_TYPES.find(t => t.tipe === filters.tipe)?.label || 'Any';
  const currentCapLabel = CAPACITY_OPTIONS.find(c => c.value === filters.min_kapasitas)?.label || 'Any';
  const currentPriceLabel = PRICE_OPTIONS.find(p => p.min === filters.min_harga && p.max === filters.max_harga)?.label || 'Any';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <section className="w-full bg-white px-6 md:px-12 py-12">
        <div className="mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink mb-8">All Spaces</h1>
          
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search spaces..."
              value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full md:w-96 px-4 py-3 rounded-full border border-stone/50 bg-white text-sm text-ink placeholder:text-ink outline-none focus:border-[#EF6905] transition-colors"
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-stone/50 bg-white">
            <div className="flex flex-wrap items-center gap-6">
              {/* Type Filter */}
              <div className="relative" data-filter-dropdown>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'type' ? null : 'type'); }}
                  className="group flex flex-col items-start gap-1 pb-1 border-b border-stone hover:border-[#EF6905] focus:border-[#EF6905] outline-none transition-colors min-w-[100px]"
                >
                  <span className="text-[11px] font-medium text-ink uppercase tracking-wider">Type</span>
                  <span className="text-sm font-semibold text-ink flex items-center gap-1">
                    {currentTypeLabel}
                    <ChevronDown className="w-3.5 h-3.5 text-ink" />
                  </span>
                </button>
                {openDropdown === 'type' && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-stone/50 rounded-xl shadow-lg py-2 z-50 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-150">
                    {SPACE_TYPES.map(t => (
                      <button
                        key={t.tipe}
                        onClick={() => { setFilters(prev => ({ ...prev, tipe: t.tipe })); setOpenDropdown(null); }}
                        className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          filters.tipe === t.tipe ? 'bg-[#EF6905]/10 text-[#EF6905] font-semibold' : 'text-ink hover:bg-stone/10'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Capacity Filter */}
              <div className="relative" data-filter-dropdown>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'cap' ? null : 'cap'); }}
                  className="group flex flex-col items-start gap-1 pb-1 border-b border-stone hover:border-[#EF6905] focus:border-[#EF6905] outline-none transition-colors min-w-[100px]"
                >
                  <span className="text-[11px] font-medium text-ink uppercase tracking-wider">Capacity</span>
                  <span className="text-sm font-semibold text-ink flex items-center gap-1">
                    {currentCapLabel}
                    <ChevronDown className="w-3.5 h-3.5 text-ink" />
                  </span>
                </button>
                {openDropdown === 'cap' && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-stone/50 rounded-xl shadow-lg py-2 z-50 min-w-[140px] animate-in fade-in slide-in-from-top-2 duration-150">
                    {CAPACITY_OPTIONS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => { setFilters(prev => ({ ...prev, min_kapasitas: c.value })); setOpenDropdown(null); }}
                        className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          filters.min_kapasitas === c.value ? 'bg-[#EF6905]/10 text-[#EF6905] font-semibold' : 'text-ink hover:bg-stone/10'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Price Range Filter */}
              <div className="relative" data-filter-dropdown>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'price' ? null : 'price'); }}
                  className="group flex flex-col items-start gap-1 pb-1 border-b border-stone hover:border-[#EF6905] focus:border-[#EF6905] outline-none transition-colors min-w-[100px]"
                >
                  <span className="text-[11px] font-medium text-ink uppercase tracking-wider">Price Range</span>
                  <span className="text-sm font-semibold text-ink flex items-center gap-1">
                    {currentPriceLabel}
                    <ChevronDown className="w-3.5 h-3.5 text-ink" />
                  </span>
                </button>
                {openDropdown === 'price' && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-stone/50 rounded-xl shadow-lg py-2 z-50 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-150">
                    {PRICE_OPTIONS.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => { setFilters(prev => ({ ...prev, min_harga: p.min, max_harga: p.max })); setOpenDropdown(null); }}
                        className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          filters.min_harga === p.min && filters.max_harga === p.max ? 'bg-[#EF6905]/10 text-[#EF6905] font-semibold' : 'text-ink hover:bg-stone/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Nearest Toggle */}
              <button
                onClick={handleNearestToggle}
                disabled={geoLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm border transition-all ${
                  nearestActive
                    ? 'bg-[#EF6905] text-white border-[#EF6905]'
                    : 'border-stone hover:bg-stone/10 bg-white text-ink'
                } ${geoLoading ? 'opacity-60 cursor-wait' : ''}`}
              >
                <MapPin className="w-4 h-4" />
                {geoLoading ? 'Locating...' : 'Nearest'}
                {nearestActive && (
                  <X className="w-3.5 h-3.5 ml-0.5" />
                )}
              </button>

              {/* Clear All Filters */}
              {(filters.tipe || filters.min_kapasitas || filters.min_harga || filters.search || nearestActive) && (
                <button
                  onClick={() => { setFilters(defaultFilters); setNearestActive(false); setUserCoords(null); setGeoError(''); }}
                  className="text-sm font-medium text-ink hover:text-ink underline transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* Geo Error Message */}
          {geoError && (
            <div className="mt-3 flex items-center gap-2 text-sm text-[#B0523A] bg-red-50 px-4 py-2.5 rounded-lg">
              <MapPin className="w-4 h-4 shrink-0" />
              {geoError}
              <button onClick={() => setGeoError('')} className="ml-auto text-ink hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/2] bg-stone/20 rounded-md mb-3" />
                <div className="h-4 bg-stone/20 rounded w-3/4 mb-2" />
                <div className="h-3 bg-stone/20 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl">
            Failed to load spaces. Please try again.
          </div>
        ) : displaySpaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displaySpaces.map((space: any) => (
              <SpaceCard
                key={space.id}
                {...space}
                jarakKm={nearestActive && space.distance != null ? space.distance : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="bg-stone/10 border border-stone border-dashed p-12 text-center rounded-lg">
            <p className="text-ink text-lg mb-4">
              Tidak ada space yang cocok dengan "{filters.search}".
            </p>
            <button
               onClick={() => { setFilters(defaultFilters); router.replace('/spaces'); }}
               className="bg-[#EF6905] text-white px-6 py-2 rounded-full font-medium"
            >
               Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#121212] px-6 md:px-12 py-12 border-t border-white/10 mt-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="font-display text-2xl font-bold text-white tracking-tight">
            SPOTSPACE
          </div>
          <div className="text-white/50 text-sm">
            © 2026 SpotSpace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function SpacesCatalogPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-white">
        <section className="w-full bg-white px-6 md:px-12 py-12">
          <div className="animate-pulse">
            <div className="h-10 bg-stone/20 rounded w-48 mb-8" />
            <div className="h-10 bg-stone/20 rounded-full w-96 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
              {[1,2,3,4].map(i => <div key={i} className="aspect-[3/2] bg-stone/20 rounded-md" />)}
            </div>
          </div>
        </section>
      </div>
    }>
      <SpacesCatalogInner />
    </Suspense>
  );
}
