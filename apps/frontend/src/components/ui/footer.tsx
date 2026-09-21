import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-[#121212] pt-16 pb-8 px-6 md:px-12 w-full text-white/70 text-sm border-t border-white/10">
      <div className="flex flex-col md:flex-row justify-between gap-10 mb-16 max-w-5xl">
        <div className="flex flex-col gap-4 max-w-xs">
          <Logo variant="light" className="h-10 w-auto mb-2" />
          <p className="text-white/60">
            Find and book a premium workspace that fits your work style. No long-term commitment required.
          </p>
          <span className="text-xs font-medium mt-4">© 2026 SpotSpace</span>
        </div>
        
        <div className="flex gap-16 md:gap-24">
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-2">Explore</h4>
            <Link href="/spaces" className="hover:text-white transition-colors">Find Space</Link>
            <Link href="/wishlist" className="hover:text-white transition-colors">Wishlist</Link>
            <Link href="/reservasi" className="hover:text-white transition-colors">My Reservation</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold mb-2">Help Center</h4>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
