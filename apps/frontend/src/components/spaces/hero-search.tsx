"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function HeroSearch() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (location) params.set("loc", location);
    
    router.push(`/spaces?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="bg-white p-2 rounded-xl flex items-center shadow-lg w-full max-w-4xl mb-12">
      <div className="flex-1 px-4 md:px-6">
        <label className="text-[11px] font-bold uppercase tracking-wider text-ink mb-1 block">What are you looking for?</label>
        <input 
          type="text" 
          placeholder="e.g. Meeting Room, Personal Desk" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full text-ink text-lg font-medium outline-none placeholder:text-ink" 
        />
      </div>
      <div className="w-px h-12 bg-stone mx-2 hidden md:block" />
      <div className="flex-1 px-4 md:px-6 hidden md:block">
        <label className="text-[11px] font-bold uppercase tracking-wider text-ink mb-1 block">Where?</label>
        <input 
          type="text" 
          placeholder="Enter a city or location" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full text-ink text-lg font-medium outline-none placeholder:text-ink" 
        />
      </div>
      <button 
        type="submit"
        className="bg-[#EF6905] hover:bg-[#EF6905]/90 text-white p-4 md:px-8 md:py-4 rounded-lg flex items-center justify-center font-bold text-lg transition-colors h-full"
      >
        <Search className="w-5 h-5 md:mr-2" />
        <span className="hidden md:inline">Search</span>
      </button>
    </form>
  );
}
