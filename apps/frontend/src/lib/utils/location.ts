// @ts-ignore
import { OpenLocationCode } from 'open-location-code';

const olc = new OpenLocationCode();

export function getCoordinatesFromPlusCode(plusCode: string): { lat: number; lng: number } | null {
  try {
    const cleanCode = plusCode.split(' ')[0].trim();
    const recoveredCode = olc.recoverNearest(cleanCode, -7.9666, 112.6326);
    const decoded = olc.decode(recoveredCode);
    return { lat: decoded.latitudeCenter, lng: decoded.longitudeCenter };
  } catch (e) {
    return null;
  }
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius bumi dalam KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
