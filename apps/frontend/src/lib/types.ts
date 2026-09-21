export interface SpaceFoto {
  id: number;
  spaceId: number;
  url: string;
  urutan: number;
}

export interface ReviewFoto {
  id: number;
  reviewId: number;
  url: string;
}

export interface Review {
  id: number;
  spaceId: number;
  memberId: number;
  rating: number; // 1-5
  komentar: string | null;
  tags: string[];
  fotoReview?: ReviewFoto[];
  createdAt: string;
  member?: Member;
}

export interface Member {
  id: number;
  userId: number;
  namaMember: string;
  instansi: string | null;
  alamat: string;
  telp: string;
  foto: string | null;
  createdByOwnerId: number | null;
  user?: { email: string; username: string; role: string };
}

export interface SpaceOwner {
  id: number;
  userId: number;
  namaCoworking: string;
  namaPemilik: string;
  telp: string;
  deskripsi: string | null;
  foto: string | null;
  alamat: string | null;
  latitude: number | null;
  longitude: number | null;
  user?: {
    username: string;
    email: string | null;
  };
}

export interface Space {
  id: number;
  namaSpace: string;
  hargaPerJam: number;
  tipe: 'desk' | 'meeting_room' | 'private_office';
  kapasitas: number;
  deskripsi: string | null;
  foto: string | null;
  ownerId: number;
  fotoGaleri?: SpaceFoto[];
  reviews?: Review[];
  createdAt: string;
  averageRating?: number;
  totalReviews?: number;
}

export interface Diskon {
  id: number;
  namaDiskon: string;
  persentaseDiskon: number;
  tanggalAwal: string;
  tanggalAkhir: string;
}

export interface DetailReservasi {
  id: number;
  reservasiId: number;
  spaceId: number;
  hargaPerJam: number;
  diskonId: number | null;
  totalHarga: number;
  space?: Space;
  diskon?: Diskon;
}

export interface Reservasi {
  id: number;
  kodeBooking: string;
  memberId: number;
  tanggalReservasi: string;
  jamMulai: string;
  jamSelesai: string;
  durasiJam: number;
  status: 'belum_dikonfirm' | 'disetujui' | 'aktif' | 'selesai' | 'dibatalkan';
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt: string;
  updatedAt: string;
  detail?: DetailReservasi;
  member?: Member;
}

export interface WishlistItem {
  id: number;
  id_space: number;
  created_at: string;
  space: {
    id: number;
    nama_space: string;
    harga_per_jam: number;
    tipe: string;
    kapasitas: number;
    deskripsi: string | null;
    foto: string | null;
    owner: {
      nama_coworking: string;
    };
  };
}

export interface ToggleWishlistResponse {
  id_space: number;
  status: 'added' | 'removed';
}
