import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getAssetUrl } from '@/lib/utils';
import { LayoutGrid } from 'lucide-react';

interface SpaceGalleryProps {
  mainFoto: string | null;
  fotoGaleri: { id: number; url: string; urutan: number }[];
  namaSpace: string;
}

export function SpaceGallery({ mainFoto, fotoGaleri, namaSpace }: SpaceGalleryProps) {
  const [isLightboxOpen, setLightboxOpen] = useState(false);

  const fallbackImage = 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1920&q=80';
  const primaryImg = mainFoto ? getAssetUrl(mainFoto) : fallbackImage;
  const secondaryImages = (fotoGaleri || []).map(f => getAssetUrl(f.url));
  
  const displaySecondary = secondaryImages.slice(0, 4);
  const allImages = [primaryImg, ...secondaryImages];
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const handleImageClick = (idx: number) => {
    setActiveImageIndex(idx);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (allImages.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allImages.length]);

  const hasSecondary = displaySecondary.length > 0;

  return (
    <>
      <div className="relative mb-8">
        <div className={`grid grid-cols-1 ${hasSecondary ? 'md:grid-cols-4' : 'md:grid-cols-1'} gap-2 rounded-2xl overflow-hidden h-[300px] md:h-[450px]`}>
          <div 
            className={`${hasSecondary ? 'md:col-span-2' : 'md:col-span-4'} relative h-full cursor-pointer group`}
            onClick={() => handleImageClick(activeImageIndex)}
          >
            <Image
              src={allImages[activeImageIndex]}
              alt={namaSpace}
              fill
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes={hasSecondary ? "(max-width: 768px) 100vw, 50vw" : "100vw"}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          
          {hasSecondary && (
            <div className={`hidden md:grid md:col-span-2 gap-2 h-full ${
              displaySecondary.length === 1 ? 'grid-cols-1 grid-rows-1' :
              displaySecondary.length === 2 ? 'grid-cols-1 grid-rows-2' :
              'grid-cols-2 grid-rows-2'
            }`}>
              {displaySecondary.map((img, idx) => {
                let itemClass = "relative h-full cursor-pointer group overflow-hidden";
                if (displaySecondary.length === 3 && idx === 0) {
                  itemClass += " col-span-2"; // First image spans top row
                }
                
                return (
                  <div 
                    key={idx} 
                    className={itemClass}
                    onClick={() => handleImageClick(idx + 1)} // main image is 0
                  >
                    <Image
                      src={img}
                      alt={`${namaSpace} - ${idx + 1}`}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="25vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* View all photos button */}
        {allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 z-10">
            <button 
              onClick={() => handleImageClick(0)} 
              className="bg-white text-ink px-4 py-2 rounded-lg font-semibold text-sm shadow-md border border-stone/20 hover:bg-stone/5 transition-colors flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Show all photos
            </button>
          </div>
        )}
      </div>

      <Dialog open={isLightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col bg-black/95 border-none p-0 overflow-hidden">
          <div className="flex-1 relative w-full h-full p-4 flex items-center justify-center">
             {allImages[activeImageIndex] && (
               <div className="relative w-full h-full flex items-center justify-center">
                 <Image
                   src={allImages[activeImageIndex]}
                   alt={`Gallery image ${activeImageIndex + 1}`}
                   fill
                   className="object-contain"
                   unoptimized
                 />
               </div>
             )}
          </div>
          <div className="h-20 bg-black flex items-center justify-center gap-2 overflow-x-auto px-4 pb-4">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative h-16 w-24 shrink-0 rounded-md overflow-hidden transition-all ${
                  activeImageIndex === idx ? 'ring-2 ring-white opacity-100' : 'opacity-50 hover:opacity-100'
                }`}
              >
                <Image src={img} alt="" fill unoptimized className="object-cover" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
