"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "cn";

const images = [
  "/images/halaman-utama.png",
  "/images/halaman-utama2.png",
  "/images/halaman-utama3.png",
  "/images/halaman-utama4.png",
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000); // 4 seconds autoplay
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#121212]">
      {images.map((src, index) => {
        const isActive = index === currentIndex;
        // Kita menggunakan z-10 untuk gambar yang aktif agar berada di atas saat transisi
        return (
          <div
            key={src}
            className={cn(
              "absolute inset-0 w-full h-full transition-all duration-[1500ms] ease-in-out",
              isActive 
                ? "opacity-100 z-10 translate-x-0" // Slide masuk dan fade in
                : "opacity-0 z-0 -translate-x-12" // Posisi saat inactive (fade out dan bergeser ke kiri)
            )}
          >
            {/* Infinite Marquee / Ken Burns effect (scale-110 & panning perlahan saat active) */}
            <Image
              src={src}
              alt={`SpotSpace Background ${index + 1}`}
              fill
              className={cn(
                "object-cover object-center transition-transform duration-[12000ms] ease-linear",
                isActive ? "scale-110 -translate-x-4" : "scale-100 translate-x-0"
              )}
              priority={index === 0}
              quality={90}
            />
          </div>
        );
      })}
    </div>
  );
}
