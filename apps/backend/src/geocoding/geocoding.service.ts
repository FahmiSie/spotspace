import { Injectable } from '@nestjs/common';

@Injectable()
export class GeocodingService {
  /**
   * Geocode alamat menggunakan Google Geocoding API.
   * Return { lat, lng } atau null jika gagal/tidak ditemukan.
   * TIDAK melempar exception — hanya log error.
   */
  async geocodeAddress(alamat: string): Promise<{ lat: number; lng: number } | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('[GeocodingService] GOOGLE_MAPS_API_KEY tidak di-set, skip geocoding.');
      return null;
    }

    try {
      const encoded = encodeURIComponent(alamat);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }

      console.warn(`[GeocodingService] Geocoding gagal untuk "${alamat}": status=${data.status}`);
      return null;
    } catch (err) {
      console.error('[GeocodingService] Error saat geocoding:', err);
      return null;
    }
  }
}
