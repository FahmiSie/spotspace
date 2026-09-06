export function hitungJamSelesai(jamMulai: string, durasiJam: number): string {
  const [h, m] = jamMulai.split(':').map(Number);
  const totalMinutes = h * 60 + m + durasiJam * 60;
  const jamAkhir = Math.floor(totalMinutes / 60) % 24;
  const menitAkhir = totalMinutes % 60;
  return `${String(jamAkhir).padStart(2, '0')}:${String(menitAkhir).padStart(2, '0')}`;
}

export function isOverlap(
  mulaiBaru: string, selesaiBaru: string,
  mulaiExisting: string, selesaiExisting: string,
): boolean {
  return mulaiBaru < selesaiExisting && selesaiBaru > mulaiExisting;
}

export function generateKodeBooking(tanggal: Date, id: number): string {
  const yyyy = tanggal.getFullYear();
  const mm = String(tanggal.getMonth() + 1).padStart(2, '0');
  const dd = String(tanggal.getDate()).padStart(2, '0');
  const idPadded = String(id).padStart(4, '0');
  return `BOOK-${yyyy}${mm}${dd}-${idPadded}`;
}