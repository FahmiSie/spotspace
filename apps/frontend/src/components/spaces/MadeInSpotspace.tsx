"use client";

import { useCallback } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import AutoScroll from "embla-carousel-auto-scroll";

const IMAGES = [
  "/images/madein/image.png",
  "/images/madein/image2.png",
  "/images/madein/image3.png",
  "/images/madein/image4.png",
  "/images/madein/image5.png",
  "/images/madein/image6.png",
  "/images/madein/image7.png",
  "/images/madein/image8.png",
  "/images/madein/image9.png",
  "/images/madein/image10.png",
];

export function MadeInSpotspace() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, dragFree: true },
    [AutoScroll({ playOnInit: true, speed: 0.5, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (autoScroll) autoScroll.reset();
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    const autoScroll = emblaApi.plugins().autoScroll;
    if (autoScroll) autoScroll.reset();
    emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="relative w-full bg-[#121212] py-40 md:py-64 overflow-hidden">
      {/* Background Typography */}
      <div className="absolute inset-0 flex flex-col justify-between items-center pointer-events-none z-0 py-12 md:py-20">
        <h2 className="text-[12vw] font-display font-bold text-white leading-none tracking-tighter">
          Made in
        </h2>
        <h2 className="text-[12vw] font-display font-bold text-white leading-none tracking-tighter">
          Spotspace
        </h2>
      </div>

      {/* Carousel */}
      <div className="relative z-10 w-full group">
        {/* Navigation Buttons - visible on hover on desktop */}
        <button 
          onClick={scrollPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full hidden md:flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto"
          aria-label="Scroll left"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={scrollNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-black/40 hover:bg-black/80 backdrop-blur-md rounded-full hidden md:flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer pointer-events-auto"
          aria-label="Scroll right"
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        {/* Scrollable Container (Embla) */}
        <div className="overflow-hidden w-full cursor-grab active:cursor-grabbing px-6 md:px-12" ref={emblaRef}>
          <div className="flex touch-pan-y -ml-6">
            {IMAGES.map((src, idx) => (
              <div 
                key={idx} 
                className="relative flex-none pl-6 w-[280px] md:w-[350px] aspect-[3/4]"
              >
                <div className="w-full h-full relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 brightness-75 hover:brightness-110">
                  <Image
                    src={src}
                    alt={`Spotspace environment ${idx + 1}`}
                    fill
                    className="object-cover pointer-events-none"
                    sizes="(max-width: 768px) 280px, 350px"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
