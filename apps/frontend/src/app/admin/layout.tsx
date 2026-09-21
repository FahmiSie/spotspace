"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useAdminProfile } from "@/lib/hooks/use-admin";
import { getAssetUrl } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AdminCommandPalette } from "@/components/admin/AdminCommandPalette";
import {
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  CalendarCheck,
  BarChart3,
  MapPin,
  LogOut,
  Menu,
  X,
  HelpCircle,
  Search,
  ChevronDown,
  QrCode,
  Star,
} from "lucide-react";
import { AdminQrScannerModal } from "@/components/admin/AdminQrScannerModal";
import { useQueryClient } from "@tanstack/react-query";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/spaces", label: "Spaces & Desks", icon: Building2 },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/diskon", label: "Discounts", icon: Tag },
  { href: "/admin/reservasi", label: "Reservations", icon: CalendarCheck },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/reports", label: "Analytics", icon: BarChart3 },
  { href: "/admin/profile", label: "Profile", icon: MapPin },
];

function SidebarLogo({ expanded }: { expanded: boolean }) {
  return (
    <div className="flex items-center gap-2.5 overflow-hidden">
      {/* Icon-only mark */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="32"
        height="32"
        fill="none"
        className="shrink-0"
      >
        <rect width="48" height="48" rx="10" fill="#FFFFFF" />
        <path
          d="M36 18H20C16.6863 18 14 20.6863 14 24C14 27.3137 16.6863 30 20 30H28C31.3137 30 34 32.6863 34 36C34 39.3137 31.3137 42 28 42H12"
          stroke="#0B0909"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="28" cy="18" r="3.5" fill="#EF6905" />
        <line x1="14" y1="36" x2="14" y2="38" stroke="#EF6905" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      {/* Wordmark — only visible when expanded */}
      <span
        className={`font-bold text-base text-white whitespace-nowrap transition-opacity duration-200 ${
          expanded ? "opacity-100" : "opacity-0 w-0"
        }`}
      >
        Spot<span className="text-[#EF6905] font-semibold">Space</span>
      </span>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { data: profile } = useAdminProfile();
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key && e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenSearch((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpenSearch(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (mounted && (!auth.token || auth.role !== "admin_space")) {
      router.replace("/auth/login");
    }
  }, [mounted, auth.token, auth.role, router]);

  if (!mounted || !auth.token || auth.role !== "admin_space") {
    return (
      <div className="min-h-screen bg-stone/10 flex items-center justify-center">
        <div className="animate-pulse text-ink font-medium">Loading...</div>
      </div>
    );
  }

  const handleLogout = () => {
    auth.logout();
    router.push("/auth/login");
  };

  const sidebarExpanded = hovered;
  const displayName = profile?.namaPemilik || profile?.namaCoworking || auth.namaMember || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* ─── SIDEBAR (Desktop: hover-expand) ─── */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`hidden lg:flex fixed top-0 left-0 z-50 h-screen flex-col bg-[#0B0909] transition-[width] duration-200 ease-in-out border-r border-[#0B0909] ${
          sidebarExpanded ? "w-64" : "w-16"
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 ${sidebarExpanded ? "px-5" : "justify-center"}`}>
          <Link href="/admin/dashboard">
            <SidebarLogo expanded={sidebarExpanded} />
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarExpanded ? item.label : undefined}
                className={`flex items-center gap-3 mx-3 my-0.5 rounded-lg transition-all duration-150 ${
                  sidebarExpanded ? "px-3 py-2.5" : "justify-center py-2.5"
                } ${
                  isActive
                    ? "bg-[#EF6905]/10 text-[#EF6905]"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#EF6905]" : ""}`} />
                {sidebarExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Scan & Logout */}
        <div className="p-3 flex flex-col gap-1">
          <button
            onClick={() => setIsScannerOpen(true)}
            title={!sidebarExpanded ? "Scan QR Ticket" : undefined}
            className={`flex items-center gap-3 w-full rounded-lg transition-colors duration-150 text-white/60 hover:text-white hover:bg-[#EF6905]/10 ${
              sidebarExpanded ? "px-3 py-2.5" : "justify-center py-2.5"
            }`}
          >
            <QrCode className="w-4 h-4 shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">Scan QR Ticket</span>}
          </button>
          
          <button
            onClick={handleLogout}
            title={!sidebarExpanded ? "Logout" : undefined}
            className={`flex items-center gap-3 w-full rounded-lg transition-colors duration-150 text-white/60 hover:text-white hover:bg-white/10 ${
              sidebarExpanded ? "px-3 py-2.5" : "justify-center py-2.5"
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE SIDEBAR (Drawer) ─── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#0B0909]/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-[#0B0909] flex flex-col transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16">
          <SidebarLogo expanded={true} />
          <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#EF6905]/10 text-[#EF6905]"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 flex flex-col gap-1">
          <button
            onClick={() => { setIsScannerOpen(true); setMobileOpen(false); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-[#EF6905]/10 w-full"
          >
            <QrCode className="w-4 h-4 shrink-0" />
            Scan QR Ticket
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 w-full"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* ─── MAIN AREA (navbar + content) ─── */}
      <div
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-[margin-left] duration-200 ease-in-out lg:ml-16`}
      >
        {/* ─── ADMIN NAVBAR ─── */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E5E5E5] h-16 flex items-center px-4 md:px-8 gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-black/5 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-[#0B0909]" />
          </button>

          {/* Coworking Name */}
          <div className="hidden md:block">
            <h2 className="text-sm font-semibold text-[#0B0909]">
              {profile?.namaCoworking || "Coworking Space"}
            </h2>
          </div>

          <div className="flex-1" />

          {/* Right side: Search + Help + Profile */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Search Shortcut */}
            <button 
              onClick={() => setOpenSearch(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-[#0B0909] hover:text-[#0B0909] hover:bg-[#E5E5E5]/50 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span className="text-xs font-medium">Search...</span>
              <kbd className="hidden lg:inline-flex ml-2 items-center gap-1 rounded bg-white px-1.5 font-mono text-[10px] font-medium text-[#0B0909] border border-[#E5E5E5]">
                <span>⌘</span>K
              </kbd>
            </button>

            {/* Help button */}
            <a
              href="mailto:support@spotspace.my.id"
              title="Help & Support"
              className="p-2 rounded-lg text-[#0B0909] hover:text-[#0B0909] hover:bg-[#E5E5E5]/50 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </a>

            <div className="w-px h-4 bg-[#E5E5E5] mx-1"></div>

            {/* Profile dropdown */}
            <Popover>
              <PopoverTrigger className="flex items-center gap-2 cursor-pointer outline-none rounded-lg hover:bg-[#E5E5E5]/50 transition-colors px-2 py-1.5">
                <div className="w-8 h-8 rounded-full bg-[#0B0909] flex items-center justify-center text-white font-display font-semibold text-xs uppercase overflow-hidden shrink-0">
                  {profile?.foto ? (
                    <img 
                      src={getAssetUrl(profile.foto)} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={profile?.foto ? "hidden" : ""}>
                    {initial}
                  </span>
                </div>
                <span className="text-sm font-medium text-ink hidden md:block max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-ink hidden md:block" />
              </PopoverTrigger>
              <PopoverContent
                className="w-56 p-2 bg-white border border-stone/30 rounded-xl shadow-lg"
                align="end"
                sideOffset={8}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="px-3 py-2 text-xs text-ink font-medium">Signed in as Admin</div>
                  <Link
                    href="/admin/profile"
                    className="px-3 py-2 text-sm text-ink hover:bg-stone/10 rounded-md transition-colors"
                  >
                    Profile
                  </Link>
                  <div className="h-px w-full bg-stone/20 my-1" />
                  <button
                    onClick={handleLogout}
                    className="text-left px-3 py-2 text-sm text-ink hover:bg-stone/10 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      {/* Command Palette */}
      <AdminCommandPalette isOpen={openSearch} onClose={() => setOpenSearch(false)} />
      {/* Scan Modal */}
      <AdminQrScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onSuccess={async () => {
          await queryClient.invalidateQueries({ queryKey: ["admin"] });
          await queryClient.refetchQueries({ queryKey: ["admin", "reservasi"] });
        }}
      />
    </div>
  );
}
