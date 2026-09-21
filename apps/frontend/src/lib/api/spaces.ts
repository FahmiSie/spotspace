import { api } from '../api';

export async function getSpace(id: number | string) {
  const res = await api.get(`/spaces/${id}`);
  return res.data;
}

export async function getSpaceReviews(id: number | string) {
  const res = await api.get(`/spaces/${id}/reviews`);
  return res.data;
}

export async function checkAvailability(params: { id_space: number | string, jam_mulai: string, durasi_jam: number, tanggal: string }) {
  const res = await api.get(`/spaces/availability`, { params });
  return res.data;
}

export async function checkDiscount(kode: string) {
  const res = await api.post(`/diskon/check`, { nama_diskon: kode });
  return res.data;
}
