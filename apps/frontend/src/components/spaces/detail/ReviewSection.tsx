"use client";

import { useEffect, useState } from "react";
import { Star, User, Loader2 } from "lucide-react";
import { cn } from "cn";
import { ReviewModal } from "./ReviewModal";
import Image from "next/image";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";

interface ReviewData {
  reviews: {
    id: number;
    rating: number;
    komentar: string;
    createdAt: string;
    member: {
      namaMember: string;
      foto: string | null;
      instansi: string | null;
    };
  }[];
  stats: {
    totalReviews: number;
    averageRating: number;
    distribution: {
      "5": number;
      "4": number;
      "3": number;
      "2": number;
      "1": number;
    };
  };
}

export function ReviewSection({ spaceId }: { spaceId: number }) {
  const { token, role } = useAuthStore();
  const [data, setData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [eligibleReservasiId, setEligibleReservasiId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/space/${spaceId}`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEligibility = async () => {
    if (!token || role !== 'member') return;
    
    try {
      const res = await api.get(`/reviews/eligibility/${spaceId}`);
      setCanReview(res.data.canReview);
      setEligibleReservasiId(res.data.eligibleReservasiId);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
    checkEligibility();
  }, [spaceId, token, role]);

  const handleReviewSuccess = () => {
    setIsModalOpen(false);
    setCanReview(false);
    fetchReviews();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-ink/50" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <section className="py-12 border-t border-stone">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-2">Guest Reviews</h2>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            <span className="text-xl font-bold">{data.stats.averageRating.toFixed(1)}</span>
            <span className="text-ink/60">·</span>
            <span className="text-ink/60">{data.stats.totalReviews} reviews</span>
          </div>
        </div>
        {canReview && eligibleReservasiId && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-ink text-white font-medium rounded-full hover:bg-ink/90 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {data.stats.totalReviews > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Distribution Progress Bars */}
          <div className="md:col-span-4 space-y-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.stats.distribution[star.toString() as keyof typeof data.stats.distribution];
              const percentage = data.stats.totalReviews > 0 ? (count / data.stats.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm">
                  <span className="w-4 font-medium">{star}</span>
                  <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Review List */}
          <div className="md:col-span-8 space-y-6">
            {data.reviews.map((review) => (
              <div key={review.id} className="bg-stone-50/50 border border-stone-200/80 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-200 flex items-center justify-center shrink-0">
                      {review.member.foto ? (
                        <Image src={review.member.foto} alt={review.member.namaMember} width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        <User className="w-6 h-6 text-ink/40" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-ink">{review.member.namaMember}</h4>
                      <p className="text-sm text-ink/60">{review.member.instansi || "Member"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full uppercase tracking-wider">Verified Booking</span>
                    <span className="text-sm text-ink/60">{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < review.rating ? "fill-amber-500 text-amber-500" : "fill-stone-200 text-stone-200")} />
                  ))}
                </div>
                <p className="text-ink/80 leading-relaxed font-[var(--font-abc-social)]">{review.komentar}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-stone-50 border border-stone border-dashed rounded-2xl p-12 text-center">
          <p className="text-ink/60 mb-2">No reviews yet.</p>
          <p className="font-medium">Be the first to share your experience after your visit!</p>
        </div>
      )}

      {isModalOpen && eligibleReservasiId && (
        <ReviewModal
          spaceId={spaceId}
          reservasiId={eligibleReservasiId}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </section>
  );
}
