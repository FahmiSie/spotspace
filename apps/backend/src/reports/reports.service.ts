import { Injectable, StreamableFile } from '@nestjs/common';
const PDFDocument = require('pdfkit');
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { MonthlyQueryDto } from './dto/monthly-query.dto';

const TIPE_LABEL: Record<string, string> = {
  desk: 'Personal Desk',
  meeting_room: 'Meeting Room',
  private_office: 'Private Office',
};

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMonthly(spaceOwnerId: number, query: MonthlyQueryDto) {
    const now = new Date();
    const month = query.month ?? now.getMonth() + 1;
    const year = query.year ?? now.getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const reservasiList = await this.prisma.reservasi.findMany({
      where: {
        status: { in: ['disetujui', 'aktif', 'selesai'] },
        tanggalReservasi: { gte: start, lt: end },
        detail: { space: { ownerId: spaceOwnerId } },
      },
      include: { detail: { include: { space: true } } },
    });

    const totalTransaksi = reservasiList.length;
    const totalJamTerpakai = reservasiList.reduce((sum, r) => sum + r.durasiJam, 0);
    const estimasiPendapatanKotor = reservasiList.reduce((sum, r) => sum + (r.detail?.totalHargaAwal ?? 0), 0);
    const totalPotonganDiskon = reservasiList.reduce((sum, r) => sum + (r.detail?.potonganDiskon ?? 0), 0);
    const realisasiPendapatanBersih = reservasiList.reduce((sum, r) => sum + (r.detail?.totalBayar ?? 0), 0);

    const perTipe: Record<string, { total_booking: number; total_jam: number; total_pendapatan: number }> = {};
    for (const r of reservasiList) {
      const tipe = r.detail?.space.tipe;
      if (!tipe) continue;
      if (!perTipe[tipe]) perTipe[tipe] = { total_booking: 0, total_jam: 0, total_pendapatan: 0 };
      perTipe[tipe].total_booking += 1;
      perTipe[tipe].total_jam += r.durasiJam;
      perTipe[tipe].total_pendapatan += r.detail?.totalBayar ?? 0;
    }

    const rincianPerTipeSpace = Object.entries(perTipe).map(([tipe, data]) => ({
      tipe,
      label: TIPE_LABEL[tipe] ?? tipe,
      ...data,
    }));

    return {
      month,
      year,
      total_transaksi: totalTransaksi,
      total_jam_terpakai: totalJamTerpakai,
      estimasi_pendapatan_kotor: estimasiPendapatanKotor,
      total_potongan_diskon: totalPotonganDiskon,
      realisasi_pendapatan_bersih: realisasiPendapatanBersih,
      rincian_per_tipe_space: rincianPerTipeSpace,
    };
  }

  async exportPdf(spaceOwnerId: number, query: MonthlyQueryDto): Promise<StreamableFile> {
    const data = await this.getMonthly(spaceOwnerId, query);
    
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(new StreamableFile(result));
      });

      doc.fontSize(20).text('Laporan Pendapatan Bulanan', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Periode: ${data.month} / ${data.year}`);
      doc.moveDown();

      doc.fontSize(12).text(`Total Transaksi: ${data.total_transaksi}`);
      doc.text(`Total Jam Terpakai: ${data.total_jam_terpakai}`);
      doc.text(`Estimasi Pendapatan Kotor: Rp${data.estimasi_pendapatan_kotor}`);
      doc.text(`Total Potongan Diskon: Rp${data.total_potongan_diskon}`);
      doc.text(`Realisasi Pendapatan Bersih: Rp${data.realisasi_pendapatan_bersih}`);
      doc.moveDown();

      doc.fontSize(14).text('Rincian per Tipe Space:', { underline: true });
      doc.moveDown(0.5);

      data.rincian_per_tipe_space.forEach((rincian) => {
        doc.fontSize(12).text(`- ${rincian.label}`);
        doc.fontSize(10).text(`  Total Booking: ${rincian.total_booking}`);
        doc.text(`  Total Jam: ${rincian.total_jam}`);
        doc.text(`  Total Pendapatan: Rp${rincian.total_pendapatan}`);
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  async exportXlsx(spaceOwnerId: number, query: MonthlyQueryDto): Promise<StreamableFile> {
    const data = await this.getMonthly(spaceOwnerId, query);
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Laporan Pendapatan');

    sheet.columns = [
      { header: 'Keterangan', key: 'keterangan', width: 30 },
      { header: 'Nilai', key: 'nilai', width: 20 },
    ];

    sheet.addRow({ keterangan: 'Periode', nilai: `${data.month} / ${data.year}` });
    sheet.addRow({});
    sheet.addRow({ keterangan: 'Total Transaksi', nilai: data.total_transaksi });
    sheet.addRow({ keterangan: 'Total Jam Terpakai', nilai: data.total_jam_terpakai });
    sheet.addRow({ keterangan: 'Estimasi Pendapatan Kotor', nilai: data.estimasi_pendapatan_kotor });
    sheet.addRow({ keterangan: 'Total Potongan Diskon', nilai: data.total_potongan_diskon });
    sheet.addRow({ keterangan: 'Realisasi Pendapatan Bersih', nilai: data.realisasi_pendapatan_bersih });
    
    sheet.addRow({});
    sheet.addRow({ keterangan: 'Rincian per Tipe Space' });
    
    data.rincian_per_tipe_space.forEach((rincian) => {
      sheet.addRow({ keterangan: rincian.label });
      sheet.addRow({ keterangan: '  Total Booking', nilai: rincian.total_booking });
      sheet.addRow({ keterangan: '  Total Jam', nilai: rincian.total_jam });
      sheet.addRow({ keterangan: '  Total Pendapatan', nilai: rincian.total_pendapatan });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new StreamableFile(Buffer.from(buffer));
  }
}