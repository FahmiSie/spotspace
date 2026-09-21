"use client";

import { useEffect, useState } from "react";

export function ScrollOverlay() {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate opacity based on scroll. Fade completely by 100vh
      const scrollY = window.scrollY;
      const maxScroll = window.innerHeight || 800;
      // Max opacity 0.8 so it doesn't get completely pitch black before it's covered
      const newOpacity = Math.min(scrollY / maxScroll, 0.8);
      setOpacity(newOpacity);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initial call
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className="absolute inset-0 bg-[#121212]/80 backdrop-blur-md pointer-events-none z-0"
      style={{ opacity }}
    />
  );
}
