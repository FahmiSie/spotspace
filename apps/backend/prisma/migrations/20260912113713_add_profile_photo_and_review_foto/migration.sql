-- AlterTable
ALTER TABLE "space_owner" ADD COLUMN     "foto" TEXT;

-- CreateTable
CREATE TABLE "review_foto" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "review_foto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "review_foto" ADD CONSTRAINT "review_foto_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
