import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, CalendarCheck, Tag, LayoutDashboard, Users, BarChart3, MapPin } from "lucide-react";

interface AdminCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const MENU_ITEMS = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Spaces & Desks", href: "/admin/spaces", icon: Building2 },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Discounts", href: "/admin/diskon", icon: Tag },
  { label: "Reservations", href: "/admin/reservasi", icon: CalendarCheck },
  { label: "Analytics", href: "/admin/reports", icon: BarChart3 },
  { label: "Location Profile", href: "/admin/profile", icon: MapPin },
];

export function AdminCommandPalette({ isOpen, onClose }: AdminCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = MENU_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <div className="bg-black/50 backdrop-blur-sm fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div 
        className="max-w-xl w-full bg-white rounded-xl shadow-2xl border border-[#E5E5E5] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-[#E5E5E5]">
          <Search className="w-5 h-5 text-[#0B0909] mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-[#0B0909] placeholder:text-[#0B0909] text-sm"
            placeholder="Search pages or commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && filteredItems.length > 0) {
                handleSelect(filteredItems[0].href);
              }
              if (e.key === "Escape") {
                onClose();
              }
            }}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-[#FAFAFA] px-1.5 font-mono text-[10px] font-medium text-[#0B0909] border border-[#E5E5E5]">
            ESC
          </kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#0B0909]">
              No results found for "{query}"
            </div>
          ) : (
            <ul className="space-y-1">
              {filteredItems.map((item) => (
                <li key={item.href}>
                  <button
                    onClick={() => handleSelect(item.href)}
                    className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm text-[#0B0909] hover:bg-[#FAFAFA] transition-colors text-left"
                  >
                    <item.icon className="w-4 h-4 mr-3 text-[#0B0909]" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
