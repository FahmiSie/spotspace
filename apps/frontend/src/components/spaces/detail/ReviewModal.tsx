"use client";

import { useState } from "react";
import { X, Star, Loader2 } from "lucide-react";
import { cn } from "cn";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";

interface ReviewModalProps {
  spaceId: number;
  reservasiId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewModal({ spaceId, reservasiId, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [komentar, setKomentar] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      (toast as any).add({ title: "Please select a rating", type: "error" });
      return;
    }
    if (komentar.length < 5) {
      (toast as any).add({ title: "Review must be at least 5 characters long", type: "error" });
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/reviews", { spaceId, reservasiId, rating, komentar });

      (toast as any).add({ title: "Review submitted successfully!", type: "success" });
      onSuccess();
    } catch (err: any) {
      (toast as any).add({ title: err.response?.data?.message || err.message || "Failed to submit review", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-ink/60 hover:text-ink hover:bg-stone-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <h3 className="font-display font-bold text-2xl mb-2 text-ink">Rate your experience</h3>
          <p className="text-ink/60 text-sm mb-8">Share your thoughts to help other members make better choices.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="flex gap-2" onMouseLeave={() => setHoveredRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-10 h-10 transition-colors",
                        (hoveredRating || rating) >= star
                          ? "fill-amber-500 text-amber-500"
                          : "fill-stone-200 text-stone-200"
                      )}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm font-medium text-ink/60 h-5">
                {rating > 0 ? ["Terrible", "Poor", "Average", "Good", "Excellent"][rating - 1] : "Select a rating"}
              </span>
            </div>

            <div className="space-y-2">
              <label htmlFor="komentar" className="block text-sm font-medium text-ink">
                Your Review
              </label>
              <textarea
                id="komentar"
                rows={4}
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                placeholder="What did you like about this space?"
                className="w-full rounded-2xl border-stone bg-stone-50 p-4 text-ink focus:border-ink focus:ring-ink transition-colors resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || rating === 0 || komentar.length < 5}
              className="w-full flex items-center justify-center gap-2 bg-ink text-white py-4 rounded-full font-bold hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              Submit Review
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
