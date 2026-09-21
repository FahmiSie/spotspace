const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.spaceOwner.update({
    where: { id: 1 },
    data: { latitude: -6.200000, longitude: 106.816666, alamat: "Jl. Sudirman No.1, Jakarta" }
  });
  console.log("Updated SpaceOwner 1");
}
main().catch(console.error).finally(() => prisma.$disconnect());
