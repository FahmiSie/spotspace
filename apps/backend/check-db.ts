import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const spaces = await prisma.space.findMany()
  const photos = new Set()
  
  spaces.forEach(s => {
    if (s.foto) {
        try {
            const url = new URL(s.foto)
            photos.add(url.hostname)
        } catch (e) {}
    }
  })
  
  console.log("Domains in DB:")
  console.log(Array.from(photos))
  
  const genericSpaces = spaces.filter(s => s.namaSpace.includes("Updated") || s.namaSpace.includes("Testing") || s.namaSpace.includes("Ruang Meeting A"))
  
  console.log(`Found ${genericSpaces.length} generic spaces.`)
  if (genericSpaces.length > 0) {
      await prisma.space.deleteMany({
          where: {
              id: { in: genericSpaces.map(s => s.id) }
          }
      })
      console.log("Deleted generic spaces.")
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
