"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Search, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Logo } from "./logo";
import { useMyProfile } from "@/lib/hooks/use-profile";
import { getAssetUrl } from "@/lib/utils";

function NavbarSearch({ isTransparent }: { isTransparent: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key && e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/spaces?search=${encodeURIComponent(searchValue.trim())}`);
    } else {
      router.push(`/spaces`);
    }
  };

  return (
    <form 
      onSubmit={handleSearch} 
      className={`hidden md:flex items-center hover:bg-white/20 transition-colors rounded-full px-4 py-2 border border-white/10 ${isTransparent ? 'bg-black/20 backdrop-blur-sm' : 'bg-white/10'}`}
    >
      <button type="submit" className="outline-none">
        <Search className="w-4 h-4 text-white/70 mr-2 cursor-pointer hover:text-white transition-colors" />
      </button>
      <input 
        ref={inputRef}
        type="text" 
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder="Search spaces..." 
        className="bg-transparent border-none outline-none text-white placeholder:text-white/50 w-64 text-sm"
      />
      <kbd className="hidden lg:inline-flex ml-2 items-center gap-1 rounded bg-white/10 px-1.5 font-mono text-[10px] font-medium text-white/60 border border-white/20">
        <span>⌘</span>K
      </kbd>
    </form>
  );
}

export function Navbar() {
  const auth = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const { data: profile } = useMyProfile();
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!isHomePage) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  const isTransparent = isHomePage && !isScrolled;
  const positionClass = isHomePage ? "fixed" : "sticky";
  const bgClass = isTransparent ? "bg-transparent" : "bg-[#0B0909] transition-colors duration-300";

  return (
    <nav className={`${positionClass} top-0 z-50 w-full ${bgClass} py-4 px-6 md:px-12 flex items-center justify-between`}>
      <div className="flex items-center gap-8">
        <Link href="/">
          <Logo variant="light" className="h-8 md:h-10 transition-transform hover:scale-[1.02]" />
        </Link>
        <Suspense fallback={<div className="w-64"></div>}>
          <NavbarSearch isTransparent={isTransparent} />
        </Suspense>
      </div>

      <div className="flex items-center gap-6">
        {auth.token ? (
          <>
            <Link 
              href="/reservasi" 
              className="text-white hover:text-[#EF6905] font-medium transition-colors text-sm drop-shadow-sm hidden md:block"
            >
              Reservations
            </Link>
            <Link 
              href="/wishlist" 
              className="text-white hover:text-[#EF6905] font-medium transition-colors text-sm drop-shadow-sm hidden md:block"
            >
              Wishlist
            </Link>
            
            <Popover>
              <PopoverTrigger className="flex items-center gap-2 cursor-pointer outline-none ml-2">
                <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm overflow-hidden shrink-0">
                  {profile?.foto ? (
                    <img 
                      src={getAssetUrl(profile.foto)} 
                      alt={profile?.namaMember || auth.namaMember || "U"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={profile?.foto ? "hidden" : ""}>
                    {(profile?.namaMember || auth.namaMember || "U").charAt(0)}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-white opacity-80" />
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 bg-[#0B0909] border border-white/10 rounded-xl" align="end" sideOffset={8}>
                <div className="flex flex-col gap-1">
                  <Link href="/profile" className="px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors">
                    My Profile
                  </Link>
                  <Link href="/reservasi" className="px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors">
                    Reservation History
                  </Link>
                  <Link href="/wishlist" className="px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors">
                    Wishlist
                  </Link>
                  <Link href="/spaces/new" className="px-3 py-2 text-sm text-[#EF6905] hover:bg-[#EF6905]/10 rounded-md transition-colors">
                    List Your Space
                  </Link>
                  <div className="h-px w-full bg-white/10 my-1" />
                  <button 
                    onClick={() => { auth.logout(); router.push('/auth/login'); }} 
                    className="text-left px-3 py-2 text-sm text-white hover:bg-white/10 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        ) : (
          <>
            <Link 
              href="/auth/login" 
              className="text-white hover:text-[#EF6905] font-medium transition-colors text-sm drop-shadow-sm"
            >
              Log In
            </Link>
            <Link 
              href="/auth/register" 
              className="bg-[#EF6905] text-white px-5 py-2.5 rounded-md font-medium hover:bg-[#EF6905]/90 transition-colors text-sm shadow-sm"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
