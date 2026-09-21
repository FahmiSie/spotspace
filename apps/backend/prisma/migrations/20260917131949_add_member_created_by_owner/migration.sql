-- AlterTable
ALTER TABLE "member" ADD COLUMN     "createdByOwnerId" INTEGER;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_createdByOwnerId_fkey" FOREIGN KEY ("createdByOwnerId") REFERENCES "space_owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
