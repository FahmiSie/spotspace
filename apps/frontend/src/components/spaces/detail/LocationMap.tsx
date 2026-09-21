import React from 'react';

interface LocationMapProps {
  alamat: string | null;
}

export function LocationMap({ alamat }: LocationMapProps) {
  return (
    <div className="mt-12 pt-8 border-t border-stone/50">
      <h3 className="font-display text-xl font-bold text-ink mb-6">Lokasi</h3>
      
      {alamat && (
        <p className="text-ink mb-4">{alamat}</p>
      )}

      {alamat ? (
        <div className="w-full h-80 rounded-xl overflow-hidden border border-stone/30 mt-3 shadow-sm bg-stone/5">
          <iframe
            title="Space Location"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(alamat)}&z=16&output=embed`}
            className="w-full h-full"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-full h-40 rounded-xl bg-stone/10 flex items-center justify-center text-ink text-sm mt-3 border border-stone/30">
          Location details not provided yet.
        </div>
      )}
    </div>
  );
}
