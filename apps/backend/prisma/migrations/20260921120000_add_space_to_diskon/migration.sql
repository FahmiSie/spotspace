-- AlterTable
ALTER TABLE "diskon" ADD COLUMN IF NOT EXISTS "space_id" INTEGER;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'diskon_space_id_fkey'
    ) THEN
        ALTER TABLE "diskon" ADD CONSTRAINT "diskon_space_id_fkey" 
        FOREIGN KEY ("space_id") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
