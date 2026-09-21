"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { Star, MessageSquare, Building2, User, Loader2, ArrowUpDown, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";
import { getAssetUrl } from "@/lib/utils";

interface AdminReviewData {
  reviews: any[];
  metrics: {
    totalReviews: number;
    globalAverageRating: number;
    topRatedSpace: { id: number; nama: string; averageRating: number; totalReviews: number } | null;
    mostReviewedSpace: { id: number; nama: string; averageRating: number; totalReviews: number } | null;
  };
}

export default function AdminReviewsPage() {
  const [data, setData] = useState<AdminReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedSpace, setSelectedSpace] = useState<number | "all">("all");
  const [selectedRating, setSelectedRating] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/reviews/admin");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const spacesList = useMemo(() => {
    if (!data) return [];
    const uniqueSpaces = new Map();
    data.reviews.forEach(r => uniqueSpaces.set(r.space.id, r.space.nama_space));
    return Array.from(uniqueSpaces.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const filteredAndSortedReviews = useMemo(() => {
    if (!data) return [];
    
    let result = [...data.reviews];

    if (selectedSpace !== "all") {
      result = result.filter(r => r.space.id === selectedSpace);
    }

    if (selectedRating !== "all") {
      result = result.filter(r => r.rating === selectedRating);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.member?.namaMember?.toLowerCase().includes(query) ||
        r.komentar?.toLowerCase().includes(query)
      );
    }

    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "highest") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "lowest") {
      result.sort((a, b) => a.rating - b.rating);
    }

    return result;
  }, [data, selectedSpace, selectedRating, sortBy, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-ink/60" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <div className="text-center text-ink/60">Failed to load reviews data.</div>
      </div>
    );
  }

  const { metrics } = data;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Reviews & Feedback</h1>
          <p className="text-ink/60 mt-2">Manage customer satisfaction across your spaces</p>
        </div>
      </div>

      {/* Baris 1: Header & Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ink/60">Overall Rating</h3>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
              <Star className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-ink">{metrics.globalAverageRating} <span className="text-lg text-ink/40 font-medium">/ 5.0</span></div>
            <p className="text-sm text-ink/60 mt-1">Average across all spaces</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ink/60">Total Feedbacks</h3>
            <div className="p-2 bg-stone-100 rounded-lg text-stone-600">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-ink">{metrics.totalReviews}</div>
            <p className="text-sm text-ink/60 mt-1">Total reviews received</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ink/60">Top Rated</h3>
            <div className="px-2 py-1 bg-stone-100 text-stone-700 text-xs font-bold rounded-full">
              Highest Rate
            </div>
          </div>
          {metrics.topRatedSpace ? (
            <div>
              <div className="text-lg font-bold text-ink truncate" title={metrics.topRatedSpace.nama}>{metrics.topRatedSpace.nama}</div>
              <p className="text-sm font-medium text-ink/60 mt-1 flex items-center gap-1">
                <Star className="w-3 h-3 fill-orange-500 text-orange-500" /> 
                {metrics.topRatedSpace.averageRating} ({metrics.topRatedSpace.totalReviews} reviews)
              </p>
            </div>
          ) : (
            <div className="text-ink/40 text-sm">No data yet</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-ink/60">Most Popular</h3>
            <div className="px-2 py-1 bg-stone-100 text-stone-700 text-xs font-bold rounded-full">
              Most Reviewed
            </div>
          </div>
          {metrics.mostReviewedSpace ? (
            <div>
              <div className="text-lg font-bold text-ink truncate" title={metrics.mostReviewedSpace.nama}>{metrics.mostReviewedSpace.nama}</div>
              <p className="text-sm font-medium text-ink/60 mt-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-ink/40" /> 
                {metrics.mostReviewedSpace.totalReviews} reviews ({metrics.mostReviewedSpace.averageRating} <Star className="w-3 h-3 inline fill-orange-500 text-orange-500 -mt-0.5" />)
              </p>
            </div>
          ) : (
            <div className="text-ink/40 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Baris 2: Toolbar Filter & Urutan */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-4 w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input 
              type="text" 
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-ink/20 text-sm"
            />
          </div>
          <div className="h-6 w-px bg-stone-200 hidden sm:block"></div>
          <select 
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
            value={selectedSpace}
            onChange={(e) => setSelectedSpace(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">All Spaces</option>
            {spacesList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select 
            className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20"
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value === "all" ? "all" : Number(e.target.value))}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <ArrowUpDown className="w-4 h-4 text-ink/40" />
          <select 
            className="bg-transparent text-sm font-medium focus:outline-none text-ink cursor-pointer"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Baris 3: Daftar Ulasan */}
      <div className="space-y-4">
        {filteredAndSortedReviews.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-ink/20" />
            </div>
            <h3 className="font-bold text-lg text-ink">No reviews found</h3>
            <p className="text-ink/60 mt-1 max-w-sm">Try adjusting your filters or search query to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedReviews.map((review) => (
              <div key={review.id} className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col h-full hover:border-stone-300 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    {review.member?.foto ? (
                      <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-stone-200">
                        <Image src={getAssetUrl(review.member.foto)} alt={review.member.namaMember || "User"} fill unoptimized className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-100 shrink-0 border border-stone-200 flex items-center justify-center text-ink/40">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-ink">{review.member?.namaMember || "Anonymous User"}</h4>
                      <p className="text-xs text-ink/50">{review.member?.instansi || "Member"}</p>
                    </div>
                  </div>
                  <div className="flex text-orange-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-current text-orange-500" : "text-stone-300"}`} />
                    ))}
                  </div>
                </div>
                
                <div className="mb-4 flex-grow">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-medium mb-3">
                    <Building2 className="w-3 h-3" />
                    {review.space?.nama_space || "Space"}
                  </span>
                  <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-wrap">{review.komentar}</p>
                </div>
                
                <div className="pt-4 border-t border-stone-100">
                  <p className="text-xs text-ink/40 font-medium">
                    {format(new Date(review.createdAt), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
