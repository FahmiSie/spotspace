import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const genericSpaces = await prisma.space.findMany({
      where: {
          OR: [
              { namaSpace: { contains: "Updated" } },
              { namaSpace: { contains: "Testing" } },
              { namaSpace: { contains: "Ruang Meeting A" } }
          ]
      }
  })
  
  const coolNames = [
      "The Glasshouse Executive Suite",
      "Creative Studio Loft 12A",
      "Serenity Private Office",
      "Downtown Co-working Hub",
      "Minimalist Focus Room",
      "Urban Tech Meeting Space"
  ];
  
  const coolDescriptions = [
      "Experience premium comfort with panoramic city views. Perfect for executive meetings and high-stakes pitches.",
      "An inspiring, sun-drenched loft designed for creative professionals and brainstorming sessions.",
      "A quiet, soundproofed haven ideal for deep work, one-on-one consultations, or focused study.",
      "Join a vibrant community in the heart of the city with state-of-the-art amenities and free-flowing coffee.",
      "Clean lines, ergonomic furniture, and zero distractions. Designed specifically to maximize your productivity.",
      "Equipped with the latest conferencing technology and ultra-fast Wi-Fi. Ideal for hybrid team syncs."
  ];

  const unsplashUrls = [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?auto=format&fit=crop&w=1920&q=80",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=1920&q=80"
  ];

  for (let i = 0; i < genericSpaces.length; i++) {
      await prisma.space.update({
          where: { id: genericSpaces[i].id },
          data: {
              namaSpace: coolNames[i % coolNames.length],
              deskripsi: coolDescriptions[i % coolDescriptions.length],
              foto: unsplashUrls[i % unsplashUrls.length]
          }
      })
  }
  
  // also check if any space has example.com and replace it
  const exampleSpaces = await prisma.space.findMany({
      where: { foto: { contains: "example.com" } }
  })
  
  for (let i = 0; i < exampleSpaces.length; i++) {
      await prisma.space.update({
          where: { id: exampleSpaces[i].id },
          data: { foto: unsplashUrls[i % unsplashUrls.length] }
      })
  }
  
  console.log("Updated generic and broken image spaces successfully.")
}

main().catch(console.error).finally(() => prisma.$disconnect())
