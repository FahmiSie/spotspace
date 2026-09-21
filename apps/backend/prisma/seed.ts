import { PrismaClient, Role, TipeSpace } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const galleryImages = [
  'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
];

async function main() {
  console.log('Start seeding...');

  // Seed Nakoa
  const pass1 = await bcrypt.hash('adminspace1', 10);
  const mainImage1 = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
  const admin1 = await prisma.user.upsert({
    where: { username: 'adminspace1' },
    update: {},
    create: {
      username: 'adminspace1',
      email: 'nakoa@spotspace.test',
      password: pass1,
      role: Role.admin_space,
      isVerified: true,
      spaceOwner: {
        create: {
          namaCoworking: 'Nakoa Cafe & Space',
          namaPemilik: 'Owner Nakoa',
          telp: '081234567001',
          alamat: '2JP2+8V Penanggungan, Kota Malang, Jawa Timur',
          deskripsi: 'Spacious aesthetic coworking cafe with high-speed internet and indoor/outdoor zones.',
          spaces: {
            create: {
              namaSpace: 'Nakoa Main Focus Desk',
              tipe: TipeSpace.desk,
              kapasitas: 12,
              hargaPerJam: 25000,
              foto: mainImage1,
              fotoGaleri: {
                create: galleryImages.map((url, i) => ({ url, urutan: i + 1 }))
              }
            }
          }
        }
      }
    }
  });
  console.log(`Created admin1: ${admin1.username} (${admin1.email})`);

  // Seed CW Coffee
  const pass2 = await bcrypt.hash('adminspace2', 10);
  const mainImage2 = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80';
  const admin2 = await prisma.user.upsert({
    where: { username: 'adminspace2' },
    update: {},
    create: {
      username: 'adminspace2',
      email: 'cwcoffee@spotspace.test',
      password: pass2,
      role: Role.admin_space,
      isVerified: true,
      spaceOwner: {
        create: {
          namaCoworking: 'CW Coffee & Workspace',
          namaPemilik: 'Owner CW Coffee',
          telp: '081234567002',
          alamat: '2JMC+M3 Oro-oro Dowo, Kota Malang, Jawa Timur',
          deskripsi: 'Comfortable 24-hour workspace tailored for productivity and collaborative sprints.',
          spaces: {
            create: {
              namaSpace: 'CW Simpang Meeting Suite',
              tipe: TipeSpace.meeting_room,
              kapasitas: 8,
              hargaPerJam: 75000,
              foto: mainImage2,
              fotoGaleri: {
                create: galleryImages.map((url, i) => ({ url, urutan: i + 1 }))
              }
            }
          }
        }
      }
    }
  });
  console.log(`Created admin2: ${admin2.username} (${admin2.email})`);

  // Seed Roketto
  const pass3 = await bcrypt.hash('adminspace3', 10);
  const mainImage3 = 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80';
  const admin3 = await prisma.user.upsert({
    where: { username: 'adminspace3' },
    update: {},
    create: {
      username: 'adminspace3',
      email: 'roketto@spotspace.test',
      password: pass3,
      role: Role.admin_space,
      isVerified: true,
      spaceOwner: {
        create: {
          namaCoworking: 'Roketto Coffee & Space',
          namaPemilik: 'Owner Roketto',
          telp: '081234567003',
          alamat: '2JJ8+4X Mojolangu, Kota Malang, Jawa Timur',
          deskripsi: 'Minimalist Japanese-inspired coworking sanctuary with ergonomic seating.',
          spaces: {
            create: {
              namaSpace: 'Roketto Private Office Box',
              tipe: TipeSpace.private_office,
              kapasitas: 4,
              hargaPerJam: 50000,
              foto: mainImage3,
              fotoGaleri: {
                create: galleryImages.map((url, i) => ({ url, urutan: i + 1 }))
              }
            }
          }
        }
      }
    }
  });
  console.log(`Created admin3: ${admin3.username} (${admin3.email})`);

  // Seed Member Demo (dilengkapi field alamat yang wajib)
  const pass4 = await bcrypt.hash('member1', 10);
  const member1 = await prisma.user.upsert({
    where: { username: 'member1' },
    update: {},
    create: {
      username: 'member1',
      email: 'member@spotspace.test',
      password: pass4,
      role: Role.member,
      isVerified: true,
      member: {
        create: {
          namaMember: 'John Member',
          telp: '081112223334',
          alamat: 'Jl. Veteran No. 8, Ketawanggede, Lowokwaru, Kota Malang',
        }
      }
    }
  });
  console.log(`Created member1: ${member1.username} (${member1.email})`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });