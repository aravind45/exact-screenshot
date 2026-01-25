-- AlterTable
ALTER TABLE "estate_documents" ADD COLUMN     "content" BYTEA;

-- AlterTable
ALTER TABLE "estates" ADD COLUMN     "probate_notes" TEXT;
