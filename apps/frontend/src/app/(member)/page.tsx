import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight } from "lucide-react";
import { SpaceCard } from "@/components/spaces/space-card";
import { ScrollOverlay } from "@/components/ui/scroll-overlay";
import { HeroCarousel } from "@/components/ui/hero-carousel";
import { MadeInSpotspace } from "@/components/spaces/MadeInSpotspace";
import { HeroSearch } from "@/components/spaces/hero-search";

async function getSpaces() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spaces`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function LandingPage() {
  const spaces = await getSpaces();
  // Take first 6 for preview
  const previewSpaces = spaces.slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 2. Hero Section */}
      <section className="sticky top-0 w-full h-[100vh] min-h-[600px] flex flex-col justify-end z-0">
        {/* Full-bleed background image with gradient overlay */}
        <div className="absolute inset-0 z-0">
          <HeroCarousel />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent pointer-events-none" />
          <ScrollOverlay />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full px-6 md:px-12 pb-20">
          <HeroSearch />

          <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-[80px] text-white leading-[1.1] max-w-4xl tracking-tight">
            Find the perfect space.<br />
            Fuel your best work.
          </h1>
        </div>
        
        {/* Solid ink bottom strip to connect visually to next sections if needed, though gradient works */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-[#121212]" />
      </section>

      <div className="relative z-10 w-full bg-white flex flex-col">
        {/* 3. Kategori Chip Section */}
        <section className="w-full px-6 md:px-12 py-12 md:py-16 border-b border-stone">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink mb-8">Browse by Activity</h2>
        <div className="flex flex-wrap items-center gap-6 md:gap-12">
          <Link href="/spaces?type=desk" className="font-display text-2xl md:text-4xl text-ink font-semibold hover:text-[#EF6905] transition-colors">
            Personal Desk
          </Link>
          <Link href="/spaces?type=meeting_room" className="font-display text-2xl md:text-4xl text-ink font-semibold hover:text-[#EF6905] transition-colors">
            Meeting Room
          </Link>
          <Link href="/spaces?type=private_office" className="font-display text-2xl md:text-4xl text-ink font-semibold hover:text-[#EF6905] transition-colors">
            Private Office
          </Link>
          <Link href="/spaces" className="font-medium text-[#EF6905] hover:underline flex items-center gap-2 mt-2 md:mt-0 md:ml-auto">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 4. Grid Listing Spaces */}
      <section className="w-full px-6 md:px-12 py-16 md:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8 md:mb-10">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">Featured Spaces</h2>
            </div>
          </div>

          {previewSpaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {previewSpaces.map((space: any) => (
                <SpaceCard key={space.id} {...space} />
              ))}
            </div>
          ) : (
            <div className="bg-stone/10 border border-stone border-dashed p-12 text-center rounded-lg">
              <p className="text-ink">No spaces available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <MadeInSpotspace />
      </div>
    </div>
  );
}
