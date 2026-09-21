const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { username: 'member@example.com' }, include: { member: true } });
  if (!user || !user.member) {
    console.log('Member not found');
    return;
  }

  const space = await prisma.space.findUnique({ where: { id: 1 } });
  if (!space) {
    console.log('Space 1 not found');
    return;
  }

  const hargaTotal = space.hargaPerJam * 2;

  // Create a completed reservation
  const res = await prisma.reservasi.create({
    data: {
      kodeBooking: 'DUMMY-REV-' + Math.floor(Math.random() * 1000),
      memberId: user.member.id,
      tanggalReservasi: new Date(),
      jamMulai: '10:00:00',
      jamSelesai: '12:00:00',
      durasiJam: 2,
      status: 'selesai',
      detail: {
        create: {
          spaceId: space.id,
          hargaPerJam: space.hargaPerJam,
          totalHargaAwal: hargaTotal,
          potonganDiskon: 0,
          totalBayar: hargaTotal
        }
      }
    }
  });

  console.log('Created dummy reservation:', res);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
